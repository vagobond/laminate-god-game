-- Drop the current policy that breaks for unauthenticated users
DROP POLICY IF EXISTS "Authenticated users can view basic profile info for lookups" ON public.profiles;

-- Create a policy that works for both authenticated and unauthenticated users
-- For unauthenticated users: only allow access to truly public fields (display_name, avatar_url, bio, hometown_city, hometown_country, link)
-- For authenticated users: allow access if not blocked
-- Note: RLS can't restrict columns, so we rely on the get_visible_profile function for proper field-level access

CREATE POLICY "Anyone can view basic public profile info"
ON public.profiles
FOR SELECT
USING (
  -- If not authenticated, allow (the get_visible_profile function handles field filtering)
  -- If authenticated, check not blocked
  auth.uid() IS NULL 
  OR (
    NOT public.is_blocked(id, auth.uid())
    AND NOT public.is_blocked(auth.uid(), id)
  )
);