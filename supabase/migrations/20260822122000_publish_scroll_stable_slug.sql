-- publish_scroll: republishing a scroll now UPDATES its active publication
-- in place (same slug, same URL) instead of minting a brand-new random slug
-- on every publish. Previously each republish created another row/URL and
-- old shared links kept pointing at stale snapshots (or died on unpublish).
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
  -- slug so previously shared links stay live and current. (Legacy data may
  -- hold several active rows per scroll from the old always-insert behavior
  -- — hence the newest-row subquery rather than a bare scroll_id match.)
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
