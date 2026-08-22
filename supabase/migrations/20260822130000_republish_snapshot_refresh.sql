-- REPAIR (urgent): 20260822122000 made publish_scroll refresh the active
-- publication in place, but the scroll_publications_lock_snapshot BEFORE
-- UPDATE trigger (20260525220316) blocks every snapshot-field change — so
-- republishing an actively-published scroll raised 'Publication snapshot
-- fields are immutable' and always failed.
--
-- Design: identity fields (slug, scroll_id, user_id) stay immutable
-- unconditionally. Snapshot fields may change ONLY inside publish_scroll's
-- republish path, signalled by a transaction-local GUC — direct client
-- UPDATEs (which the owner RLS policy otherwise permits) remain blocked.

CREATE OR REPLACE FUNCTION public.scroll_publications_lock_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Identity is immutable, no exceptions.
  IF NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.scroll_id IS DISTINCT FROM OLD.scroll_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'Publication identity fields are immutable';
  END IF;

  -- Snapshot refresh is allowed only for publish_scroll's republish, which
  -- sets this transaction-local flag immediately before its UPDATE.
  IF current_setting('xcrol.allow_snapshot_refresh', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.subtitle IS DISTINCT FROM OLD.subtitle
     OR NEW.blurb IS DISTINCT FROM OLD.blurb
     OR NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url
     OR NEW.content_json IS DISTINCT FROM OLD.content_json
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
  THEN
    RAISE EXCEPTION 'Publication snapshot fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_scroll(p_scroll_id uuid, p_visibility text DEFAULT 'public')
RETURNS public.scroll_publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_scroll public.scrolls;
  v_content jsonb;
  v_slug text;
  v_base text;
  v_pub public.scroll_publications;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_visibility NOT IN ('public','unlisted') THEN
    RAISE EXCEPTION 'Invalid visibility';
  END IF;

  SELECT * INTO v_scroll FROM public.scrolls WHERE id = p_scroll_id;
  IF v_scroll.id IS NULL OR v_scroll.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Scroll not found or not owner';
  END IF;

  -- Snapshot contents
  SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.item_position), '[]'::jsonb)
    INTO v_content
  FROM public.get_scroll_contents(p_scroll_id) c;

  -- Republish: refresh the newest ACTIVE publication in place, keeping its
  -- slug so previously shared links stay live and current. The transaction-
  -- local flag authorizes the snapshot-field change with the lock trigger.
  PERFORM set_config('xcrol.allow_snapshot_refresh', 'on', true);
  UPDATE public.scroll_publications
     SET title = v_scroll.title,
         subtitle = v_scroll.subtitle,
         blurb = v_scroll.blurb,
         cover_image_url = v_scroll.cover_image_url,
         content_json = v_content,
         visibility = p_visibility,
         published_at = now(),
         updated_at = now()
   WHERE id = (
       SELECT sp.id FROM public.scroll_publications sp
        WHERE sp.scroll_id = v_scroll.id AND sp.unpublished_at IS NULL
        ORDER BY sp.published_at DESC
        LIMIT 1
     )
  RETURNING * INTO v_pub;
  PERFORM set_config('xcrol.allow_snapshot_refresh', 'off', true);
  IF v_pub.id IS NOT NULL THEN
    RETURN v_pub;
  END IF;

  -- First publish (or republish after an unpublish): mint a fresh slug.
  v_base := lower(regexp_replace(coalesce(v_scroll.title, 'scroll'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  IF length(v_base) = 0 THEN v_base := 'scroll'; END IF;
  IF length(v_base) > 60 THEN v_base := substring(v_base from 1 for 60); END IF;
  v_slug := v_base || '-' || substring(encode(gen_random_bytes(4),'hex') from 1 for 6);

  INSERT INTO public.scroll_publications
    (scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, content_json, visibility)
  VALUES
    (v_scroll.id, v_scroll.user_id, v_slug, v_scroll.title, v_scroll.subtitle, v_scroll.blurb,
     v_scroll.cover_image_url, v_content, p_visibility)
  RETURNING * INTO v_pub;

  RETURN v_pub;
END;
$$;
