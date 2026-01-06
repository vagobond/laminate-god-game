-- Fix the get_connection_degree function
-- The degree should be path.length - 1 (e.g., A->B->C has path length 3 but is 2nd degree)
CREATE OR REPLACE FUNCTION public.get_connection_degree(from_user_id uuid, to_user_id uuid, max_depth integer DEFAULT 6)
 RETURNS TABLE(degree integer, path uuid[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Same user = 0 degrees
  IF from_user_id = to_user_id THEN
    degree := 0;
    path := ARRAY[from_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check for direct friendship (1st degree) - check both directions
  IF EXISTS (
    SELECT 1 FROM friendships f
    WHERE (
      (f.user_id = from_user_id AND f.friend_id = to_user_id) OR
      (f.user_id = to_user_id AND f.friend_id = from_user_id)
    )
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  ) THEN
    degree := 1;
    path := ARRAY[from_user_id, to_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Use recursive CTE for BFS to find shortest path
  -- Return degree as (path_length - 1) since that's the number of connections
  RETURN QUERY
  WITH RECURSIVE valid_friendships AS (
    -- Pre-filter to only valid friendship levels
    SELECT DISTINCT 
      f.user_id,
      f.friend_id
    FROM friendships f
    WHERE f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  ),
  connection_search AS (
    -- Base case: start from direct friends of from_user_id
    SELECT 
      vf.friend_id AS current_user,
      2 AS depth,
      ARRAY[from_user_id, vf.friend_id] AS path_arr,
      ARRAY[from_user_id, vf.friend_id] AS visited
    FROM valid_friendships vf
    WHERE vf.user_id = from_user_id
    
    UNION ALL
    
    -- Recursive case: expand to next level
    SELECT 
      vf.friend_id,
      cs.depth + 1,
      cs.path_arr || vf.friend_id,
      cs.visited || vf.friend_id
    FROM connection_search cs
    JOIN valid_friendships vf ON vf.user_id = cs.current_user
    WHERE cs.depth < max_depth
    AND NOT (vf.friend_id = ANY(cs.visited))
    AND cs.current_user != to_user_id  -- Stop expanding if we found target
  )
  SELECT 
    (array_length(cs.path_arr, 1) - 1)::integer AS degree,  -- Degree is path length - 1
    cs.path_arr AS path
  FROM connection_search cs
  WHERE cs.current_user = to_user_id
  ORDER BY array_length(cs.path_arr, 1)
  LIMIT 1;
  
  RETURN;
END;
$function$;