-- Gate the named friends list by the owner's constellation threshold
-- (2026-08-21 audit, item 1 — CD's decision: "gate the list by the same threshold").
--
-- get_visible_friends previously returned the owner's non-secret friends WITH
-- NAMES to any caller, including anon, regardless of constellation_visibility.
-- That undercut the 'hidden' / 'nobody' settings shipped in 20260818110000: an
-- owner could hide their constellation while the same page listed the same
-- people by name.
--
-- Now the list applies the exact same threshold semantics as get_constellation:
--   * owner: sees everything they set (unchanged)
--   * 'hidden' / 'nobody': no one else sees the list
--   * tier thresholds: the viewer's rung FROM the owner (secret_friend masked
--     up to close_friend) must meet the threshold
--   * 'everyone': any AUTHENTICATED viewer; the list is named-only, so anon
--     never qualifies (matching get_constellation, where anon gets only
--     anonymous dots — a list has no anonymous mode)
--   * blocks in either direction: empty, as before
-- Since the column default is 'nobody', friend lists are private by default.
CREATE OR REPLACE FUNCTION public.get_visible_friends(profile_id uuid, viewer_id uuid)
 RETURNS TABLE(id uuid, friend_id uuid, level friendship_level, display_name text, avatar_url text)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  -- viewer_id parameter is IGNORED: the viewer is whoever is authenticated.
  v_viewer uuid := auth.uid();
  v_is_owner boolean := (v_viewer IS NOT NULL AND v_viewer = profile_id);
  v_threshold text;
  v_viewer_level friendship_level;
  v_ok boolean := false;
BEGIN
  IF NOT v_is_owner THEN
    SELECT constellation_visibility INTO v_threshold
      FROM public.profiles WHERE profiles.id = profile_id;
    IF v_threshold IS NULL OR v_threshold IN ('hidden', 'nobody') THEN RETURN; END IF;
    -- The list is named-only: anonymous viewers never qualify.
    IF v_viewer IS NULL THEN RETURN; END IF;
    IF public.is_blocked(profile_id, v_viewer) OR public.is_blocked(v_viewer, profile_id) THEN
      RETURN;
    END IF;
    IF v_threshold = 'everyone' THEN
      v_ok := true;
    ELSE
      SELECT f.level INTO v_viewer_level FROM public.friendships f
       WHERE f.user_id = profile_id AND f.friend_id = v_viewer LIMIT 1;
      IF v_viewer_level = 'secret_friend' THEN v_viewer_level := 'close_friend'; END IF;
      IF v_viewer_level IS NULL OR v_viewer_level IN ('secret_enemy', 'fake_friend') THEN
        v_ok := false;
      ELSE
        v_ok := array_position(ARRAY['close_friend','family','buddy','friendly_acquaintance'], v_viewer_level::text)
             <= array_position(ARRAY['close_friend','family','buddy','friendly_acquaintance'], v_threshold);
      END IF;
    END IF;
    IF NOT v_ok THEN RETURN; END IF;
  END IF;

  RETURN QUERY
  SELECT f.id, f.friend_id, f.level, p.display_name, p.avatar_url
  FROM public.friendships f
  LEFT JOIN public.profiles p ON p.id = f.friend_id
  WHERE f.user_id = profile_id
    AND (v_is_owner OR f.level NOT IN ('secret_friend', 'secret_enemy', 'fake_friend'))
    AND (
      v_is_owner
      OR NOT (public.is_blocked(f.friend_id, v_viewer) OR public.is_blocked(v_viewer, f.friend_id))
    )
  ORDER BY f.created_at DESC;
END;
$function$;
