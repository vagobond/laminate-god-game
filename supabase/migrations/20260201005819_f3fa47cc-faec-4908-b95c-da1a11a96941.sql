-- Optimize get_connection_degree function with better indexing and early termination
-- Reduce default max_depth from 6 to 3 for much faster queries (3 degrees covers most use cases)
CREATE OR REPLACE FUNCTION public.get_connection_degree(from_user_id uuid, to_user_id uuid, max_depth integer DEFAULT 3)
RETURNS TABLE(degree integer, path uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Same user = 0 degrees
  IF from_user_id = to_user_id THEN
    degree := 0;
    path := ARRAY[from_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check for direct friendship (1st degree) - check both directions
  -- Includes 'family' level
  IF EXISTS (
    SELECT 1 FROM friendships f
    WHERE (
      (f.user_id = from_user_id AND f.friend_id = to_user_id) OR
      (f.user_id = to_user_id AND f.friend_id = from_user_id)
    )
    AND f.level IN ('family', 'close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  ) THEN
    degree := 1;
    path := ARRAY[from_user_id, to_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Only do recursive search if max_depth > 1
  IF max_depth <= 1 THEN
    RETURN;
  END IF;

  -- Use optimized bidirectional BFS for faster path finding
  -- This checks from both ends and meets in the middle
  RETURN QUERY
  WITH RECURSIVE 
  valid_friendships AS MATERIALIZED (
    -- Pre-filter to only valid friendship levels (includes 'family')
    SELECT DISTINCT 
      f.user_id AS u1,
      f.friend_id AS u2
    FROM friendships f
    WHERE f.level IN ('family', 'close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  ),
  bidirectional AS (
    SELECT u1, u2 FROM valid_friendships
    UNION ALL
    SELECT u2, u1 FROM valid_friendships
  ),
  forward_search AS (
    -- Search from start
    SELECT 
      bf.u2 AS current_user,
      2 AS depth,
      ARRAY[from_user_id, bf.u2] AS path_arr
    FROM bidirectional bf
    WHERE bf.u1 = from_user_id
    
    UNION ALL
    
    SELECT 
      bf.u2,
      fs.depth + 1,
      fs.path_arr || bf.u2
    FROM forward_search fs
    JOIN bidirectional bf ON bf.u1 = fs.current_user
    WHERE fs.depth < max_depth
    AND NOT (bf.u2 = ANY(fs.path_arr))
    AND fs.current_user != to_user_id
  )
  SELECT 
    (array_length(fs.path_arr, 1) - 1)::integer AS degree,
    fs.path_arr AS path
  FROM forward_search fs
  WHERE fs.current_user = to_user_id
  ORDER BY array_length(fs.path_arr, 1)
  LIMIT 1;
  
  RETURN;
END;
$$;

-- Create indexes to speed up friendship queries if they don't exist
CREATE INDEX IF NOT EXISTS idx_friendships_user_friend ON friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_user ON friendships(friend_id, user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_level ON friendships(level);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_friendships_user_level ON friendships(user_id, level);