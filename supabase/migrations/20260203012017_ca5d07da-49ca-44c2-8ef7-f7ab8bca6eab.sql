
-- Priority 2: Create security definer function for xcrol visibility with early returns
-- This replaces multiple is_blocked() calls in RLS with a single optimized function

CREATE OR REPLACE FUNCTION public.can_view_xcrol_entry(
  p_entry_user_id uuid,
  p_privacy_level text,
  p_viewer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Early return: public entries are always visible
  IF p_privacy_level = 'public' THEN
    RETURN true;
  END IF;
  
  -- Early return: owner can always see their own entries
  IF p_viewer_id = p_entry_user_id THEN
    RETURN true;
  END IF;
  
  -- Early return: anonymous users can't see non-public entries
  IF p_viewer_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check blocks (both directions) - single query instead of two separate calls
  IF EXISTS (
    SELECT 1 FROM user_blocks 
    WHERE (blocker_id = p_entry_user_id AND blocked_id = p_viewer_id)
       OR (blocker_id = p_viewer_id AND blocked_id = p_entry_user_id)
  ) THEN
    RETURN false;
  END IF;
  
  -- Check friendship level matches privacy level
  RETURN EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = p_entry_user_id 
      AND f.friend_id = p_viewer_id
      AND (
        (p_privacy_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend', 'family'))
        OR (p_privacy_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend', 'family'))
        OR (p_privacy_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend', 'family'))
      )
  );
END;
$$;

-- Drop old complex policies
DROP POLICY IF EXISTS "Anyone can view public entries" ON public.xcrol_entries;
DROP POLICY IF EXISTS "Friends can view entries based on privacy" ON public.xcrol_entries;
DROP POLICY IF EXISTS "Users can view their own entries" ON public.xcrol_entries;

-- Create single optimized SELECT policy using security definer function
CREATE POLICY "Users can view visible entries"
ON public.xcrol_entries
FOR SELECT
TO public
USING (
  public.can_view_xcrol_entry(user_id, privacy_level, auth.uid())
);

-- Optimize xcrol_reactions policies similarly
DROP POLICY IF EXISTS "Users can view reactions on visible entries" ON public.xcrol_reactions;
DROP POLICY IF EXISTS "Users can add reactions to visible entries" ON public.xcrol_reactions;

CREATE POLICY "Users can view reactions on visible entries"
ON public.xcrol_reactions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM xcrol_entries e
    WHERE e.id = entry_id
    AND public.can_view_xcrol_entry(e.user_id, e.privacy_level, auth.uid())
  )
);

CREATE POLICY "Users can add reactions to visible entries"
ON public.xcrol_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM xcrol_entries e
    WHERE e.id = entry_id
    AND public.can_view_xcrol_entry(e.user_id, e.privacy_level, auth.uid())
  )
);

-- Priority 2: Create materialized view for connection degrees
-- This caches friendship pairs for faster degree lookups

CREATE MATERIALIZED VIEW IF NOT EXISTS public.friendship_pairs AS
SELECT 
  user_id AS user_a,
  friend_id AS user_b
FROM public.friendships
WHERE level NOT IN ('fake_friend', 'not_friend', 'secret_enemy')
UNION
SELECT 
  friend_id AS user_a,
  user_id AS user_b
FROM public.friendships
WHERE level NOT IN ('fake_friend', 'not_friend', 'secret_enemy');

-- Index for fast lookups on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendship_pairs_unique 
ON public.friendship_pairs(user_a, user_b);

CREATE INDEX IF NOT EXISTS idx_friendship_pairs_user_a 
ON public.friendship_pairs(user_a);

CREATE INDEX IF NOT EXISTS idx_friendship_pairs_user_b 
ON public.friendship_pairs(user_b);

-- Function to refresh the materialized view (call on friendship changes)
CREATE OR REPLACE FUNCTION public.refresh_friendship_pairs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.friendship_pairs;
  RETURN NULL;
END;
$$;

-- Trigger to refresh on friendship changes
DROP TRIGGER IF EXISTS refresh_friendship_pairs_trigger ON public.friendships;

CREATE TRIGGER refresh_friendship_pairs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.friendships
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_friendship_pairs();

-- Optimized connection degree function using materialized view
CREATE OR REPLACE FUNCTION public.get_connection_degree_fast(
  from_user_id uuid,
  to_user_id uuid,
  max_depth integer DEFAULT 3
)
RETURNS TABLE(degree integer, path uuid[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Early return: same user
  IF from_user_id = to_user_id THEN
    RETURN QUERY SELECT 0, ARRAY[from_user_id];
    RETURN;
  END IF;
  
  -- Use materialized view for BFS
  RETURN QUERY
  WITH RECURSIVE search_graph AS (
    -- Base case: direct friends (degree 1)
    SELECT 
      fp.user_b AS current_user,
      1 AS depth,
      ARRAY[from_user_id, fp.user_b] AS user_path
    FROM friendship_pairs fp
    WHERE fp.user_a = from_user_id
    
    UNION ALL
    
    -- Recursive case
    SELECT 
      fp.user_b,
      sg.depth + 1,
      sg.user_path || fp.user_b
    FROM search_graph sg
    JOIN friendship_pairs fp ON fp.user_a = sg.current_user
    WHERE sg.depth < max_depth
      AND NOT fp.user_b = ANY(sg.user_path)  -- Prevent cycles
  )
  SELECT sg.depth, sg.user_path
  FROM search_graph sg
  WHERE sg.current_user = to_user_id
  ORDER BY sg.depth
  LIMIT 1;
END;
$$;
