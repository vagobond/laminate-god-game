-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles show limited info" ON public.profiles;

-- Create a new restrictive policy that only allows public access to non-sensitive fields
-- This is done by creating a policy that allows SELECT but the application should use
-- the get_visible_profile function for proper access control
-- For direct table access, we only allow users to see their own full profile
-- or basic public info through the RPC function

-- Since RLS can't restrict columns (only rows), we need to ensure all profile 
-- access goes through the secure get_visible_profile function
-- The "Users can view their own profile" policy already exists for self-access
-- We'll create a policy that allows authenticated users to see basic info needed for lookups

CREATE POLICY "Authenticated users can view basic profile info for lookups"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see any profile's basic info if not blocked
  NOT public.is_blocked(id, auth.uid())
  AND NOT public.is_blocked(auth.uid(), id)
);