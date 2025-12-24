CREATE OR REPLACE FUNCTION public.get_visible_friends(profile_id uuid, viewer_id uuid)
RETURNS TABLE(
  id uuid,
  friend_id uuid,
  level friendship_level,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_owner boolean := false;
  v_is_blocked boolean := false;
BEGIN
  IF viewer_id IS NOT NULL THEN
    v_is_owner := (viewer_id = profile_id);

    SELECT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = profile_id AND blocked_id = viewer_id)
         OR (blocker_id = viewer_id AND blocked_id = profile_id)
    ) INTO v_is_blocked;

    IF v_is_blocked AND NOT v_is_owner THEN
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.friend_id,
    f.level,
    p.display_name,
    p.avatar_url
  FROM public.friendships f
  JOIN public.profiles p ON p.id = f.friend_id
  WHERE f.user_id = profile_id
    AND (
      v_is_owner
      OR f.level NOT IN ('secret_friend', 'fake_friend', 'secret_enemy')
    )
  ORDER BY f.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visible_friends(uuid, uuid) TO anon, authenticated;