-- Harden friend-list visibility.
--
-- 1) get_visible_friends trusted a CLIENT-SUPPLIED viewer_id for the owner
--    check (20260113222431). Anyone — including anon — could call it with
--    viewer_id = profile_id and receive the profile's secret_friend /
--    secret_enemy rows with display names (verified live 2026-08-18). The
--    same rewrite had also dropped the user_blocks check that the 20251224
--    version had. Now: viewer = auth.uid() (the parameter is kept only so
--    existing call sites keep working and is ignored), blocks in either
--    direction between viewer and profile owner return nothing, and friends
--    with a block between them and the viewer are filtered out.
--
-- 2) constellation_visibility gains a 'hidden' value (don't render the
--    constellation for anyone but the owner) and a server-side RPC
--    get_constellation() that applies the owner's threshold itself instead of
--    shipping names to every client and hiding them in JS.

-- ---------------------------------------------------------------------------
-- 1) get_visible_friends
-- ---------------------------------------------------------------------------
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
BEGIN
  -- Blocked in either direction: the profile has no visible friends.
  IF NOT v_is_owner AND v_viewer IS NOT NULL AND (
       public.is_blocked(profile_id, v_viewer) OR public.is_blocked(v_viewer, profile_id)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.friend_id,
    f.level,
    p.display_name,
    p.avatar_url
  FROM public.friendships f
  LEFT JOIN public.profiles p ON p.id = f.friend_id
  WHERE f.user_id = profile_id
    AND (
      v_is_owner
      OR f.level NOT IN ('secret_friend', 'secret_enemy', 'fake_friend')
    )
    -- Hide friends who have a block with the viewer (either direction).
    AND (
      v_is_owner
      OR v_viewer IS NULL
      OR NOT (public.is_blocked(f.friend_id, v_viewer) OR public.is_blocked(v_viewer, f.friend_id))
    )
  ORDER BY f.created_at DESC;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 2) constellation: 'hidden' option + server-side threshold
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_constellation_visibility_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_constellation_visibility_check
  CHECK (constellation_visibility IN (
    'hidden', 'nobody', 'close_friend', 'family', 'buddy', 'friendly_acquaintance', 'everyone'
  ));

-- Returns the profile owner's constellation as the CALLER may see it.
--   named = true  → friend_id / display_name / avatar_url populated (viewer meets
--                   the owner's threshold, or is the owner)
--   named = false → identity columns are NULL; only level is returned (anonymous dots)
-- Returns no rows when the owner set 'hidden' (unless caller is owner), when
-- there is a block between viewer and owner, or for the secret tiers
-- (secret_friend rows are shown to the owner only; secret_enemy/fake_friend never).
CREATE OR REPLACE FUNCTION public.get_constellation(profile_id uuid)
 RETURNS TABLE(id uuid, friend_id uuid, level friendship_level, display_name text, avatar_url text, named boolean)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  v_viewer uuid := auth.uid();
  v_is_owner boolean := (v_viewer IS NOT NULL AND v_viewer = profile_id);
  v_threshold text;
  v_viewer_level friendship_level;
  v_named boolean := false;
BEGIN
  SELECT constellation_visibility INTO v_threshold FROM public.profiles WHERE profiles.id = profile_id;
  IF v_threshold IS NULL THEN RETURN; END IF;

  IF NOT v_is_owner THEN
    IF v_threshold = 'hidden' THEN RETURN; END IF;
    IF v_viewer IS NOT NULL AND (
         public.is_blocked(profile_id, v_viewer) OR public.is_blocked(v_viewer, profile_id)
    ) THEN RETURN; END IF;

    -- The rung the OWNER granted the viewer decides whether names are shown.
    IF v_viewer IS NOT NULL THEN
      SELECT f.level INTO v_viewer_level FROM public.friendships f
       WHERE f.user_id = profile_id AND f.friend_id = v_viewer LIMIT 1;
    END IF;
    IF v_viewer_level = 'secret_friend' THEN v_viewer_level := 'close_friend'; END IF;

    v_named := CASE
      WHEN v_threshold = 'everyone' THEN v_viewer IS NOT NULL
      WHEN v_threshold = 'nobody' THEN false
      WHEN v_viewer_level IS NULL THEN false
      WHEN v_viewer_level IN ('secret_enemy', 'fake_friend') THEN false
      ELSE (
        -- ordered most→least trusted; viewer qualifies at or above threshold
        array_position(ARRAY['close_friend','family','buddy','friendly_acquaintance'], v_viewer_level::text)
        <= array_position(ARRAY['close_friend','family','buddy','friendly_acquaintance'], v_threshold)
      )
    END;
  ELSE
    v_named := true;
  END IF;

  RETURN QUERY
  SELECT
    CASE WHEN v_named THEN f.id ELSE NULL END,
    CASE WHEN v_named THEN f.friend_id ELSE NULL END,
    f.level,
    CASE WHEN v_named THEN p.display_name ELSE NULL END,
    CASE WHEN v_named THEN p.avatar_url ELSE NULL END,
    v_named
  FROM public.friendships f
  LEFT JOIN public.profiles p ON p.id = f.friend_id
  WHERE f.user_id = profile_id
    AND f.level NOT IN ('secret_enemy', 'fake_friend')
    AND (v_is_owner OR f.level <> 'secret_friend')
    AND (
      v_is_owner
      OR v_viewer IS NULL
      OR NOT (public.is_blocked(f.friend_id, v_viewer) OR public.is_blocked(v_viewer, f.friend_id))
    )
  ORDER BY f.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_constellation(uuid) TO anon, authenticated;
