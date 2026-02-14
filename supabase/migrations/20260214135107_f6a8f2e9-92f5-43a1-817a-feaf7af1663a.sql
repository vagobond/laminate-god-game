
CREATE OR REPLACE FUNCTION public.get_river_entries(
  p_viewer_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_filter text DEFAULT 'all'
)
RETURNS TABLE(
  id uuid,
  content text,
  link text,
  entry_date date,
  privacy_level text,
  user_id uuid,
  author_display_name text,
  author_avatar_url text,
  author_username text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.link,
    e.entry_date,
    e.privacy_level,
    e.user_id,
    p.display_name,
    p.avatar_url,
    p.username
  FROM xcrol_entries e
  JOIN profiles p ON p.id = e.user_id
  WHERE
    -- Privacy: use existing can_view_xcrol_entry function
    public.can_view_xcrol_entry(e.user_id, e.privacy_level, p_viewer_id)
    -- UI filter
    AND (
      p_filter = 'all'
      OR (p_filter = 'public' AND e.privacy_level = 'public')
      OR (p_filter = 'family' AND (
        e.user_id = p_viewer_id
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = p_viewer_id AND f.friend_id = e.user_id AND f.level = 'family'
        )
      ))
      OR (p_filter IN ('close_friend', 'buddy', 'friendly_acquaintance') AND (
        e.user_id = p_viewer_id
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = p_viewer_id AND f.friend_id = e.user_id
          AND (
            (p_filter = 'friendly_acquaintance' AND f.level IN ('close_friend', 'secret_friend', 'buddy', 'friendly_acquaintance'))
            OR (p_filter = 'buddy' AND f.level IN ('close_friend', 'secret_friend', 'buddy'))
            OR (p_filter = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
          )
        )
      ))
    )
  ORDER BY e.entry_date DESC, e.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
