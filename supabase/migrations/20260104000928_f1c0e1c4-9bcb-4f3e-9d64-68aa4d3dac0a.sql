-- Function to calculate connection degree and path between two users
-- Returns the degree (1, 2, 3, etc.) and the path of user IDs
CREATE OR REPLACE FUNCTION public.get_connection_degree(
  from_user_id uuid,
  to_user_id uuid,
  max_depth integer DEFAULT 6
)
RETURNS TABLE(
  degree integer,
  path uuid[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_depth integer := 0;
  found boolean := false;
  result_path uuid[];
BEGIN
  -- Same user = 0 degrees
  IF from_user_id = to_user_id THEN
    degree := 0;
    path := ARRAY[from_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check for direct friendship (1st degree) - bidirectional check
  IF EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = to_user_id 
    AND f.friend_id = from_user_id
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  ) THEN
    degree := 1;
    path := ARRAY[from_user_id, to_user_id];
    RETURN NEXT;
    RETURN;
  END IF;

  -- Use BFS to find shortest path for 2nd+ degree
  -- Create temp tables for BFS
  CREATE TEMP TABLE IF NOT EXISTS bfs_queue (
    user_id uuid,
    depth int,
    path uuid[]
  ) ON COMMIT DROP;
  
  CREATE TEMP TABLE IF NOT EXISTS bfs_visited (
    user_id uuid PRIMARY KEY
  ) ON COMMIT DROP;
  
  TRUNCATE bfs_queue;
  TRUNCATE bfs_visited;
  
  -- Start from the source user's direct friends
  INSERT INTO bfs_queue (user_id, depth, path)
  SELECT f.friend_id, 1, ARRAY[from_user_id, f.friend_id]
  FROM friendships f
  WHERE f.user_id = from_user_id
  AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend');
  
  INSERT INTO bfs_visited SELECT from_user_id;
  
  WHILE current_depth < max_depth AND NOT found LOOP
    current_depth := current_depth + 1;
    
    -- Mark current depth nodes as visited
    INSERT INTO bfs_visited (user_id)
    SELECT DISTINCT q.user_id FROM bfs_queue q
    WHERE q.depth = current_depth
    ON CONFLICT DO NOTHING;
    
    -- Check if target is in current level
    SELECT q.path INTO result_path
    FROM bfs_queue q
    WHERE q.user_id = to_user_id AND q.depth = current_depth
    LIMIT 1;
    
    IF result_path IS NOT NULL THEN
      found := true;
      degree := current_depth;
      path := result_path;
      RETURN NEXT;
      DROP TABLE IF EXISTS bfs_queue;
      DROP TABLE IF EXISTS bfs_visited;
      RETURN;
    END IF;
    
    -- Expand to next level
    INSERT INTO bfs_queue (user_id, depth, path)
    SELECT DISTINCT f.friend_id, current_depth + 1, q.path || f.friend_id
    FROM bfs_queue q
    JOIN friendships f ON f.user_id = q.user_id
    WHERE q.depth = current_depth
    AND f.friend_id NOT IN (SELECT user_id FROM bfs_visited)
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend');
  END LOOP;
  
  DROP TABLE IF EXISTS bfs_queue;
  DROP TABLE IF EXISTS bfs_visited;
  
  -- No connection found
  RETURN;
END;
$$;

-- Create introduction_requests table
CREATE TABLE public.introduction_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  introducer_id uuid NOT NULL,
  target_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.introduction_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can create introduction requests"
ON public.introduction_requests
FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
  AND NOT is_blocked(introducer_id, requester_id)
  AND NOT is_blocked(requester_id, introducer_id)
  AND NOT is_blocked(target_id, requester_id)
  AND NOT is_blocked(requester_id, target_id)
  -- Requester must be friends with introducer
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = introducer_id
    AND f.friend_id = requester_id
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  )
  -- Introducer must be friends with target
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = target_id
    AND f.friend_id = introducer_id
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  )
);

CREATE POLICY "Users can view requests they are part of"
ON public.introduction_requests
FOR SELECT
USING (
  auth.uid() = requester_id 
  OR auth.uid() = introducer_id 
  OR auth.uid() = target_id
);

CREATE POLICY "Introducers can update request status"
ON public.introduction_requests
FOR UPDATE
USING (auth.uid() = introducer_id OR auth.uid() = requester_id);

CREATE POLICY "Requesters can delete their pending requests"
ON public.introduction_requests
FOR DELETE
USING (auth.uid() = requester_id AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_introduction_requests_updated_at
BEFORE UPDATE ON public.introduction_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();