-- Drop the insecure policy that allows unauthenticated access
DROP POLICY IF EXISTS "Anyone can view basic public profile info" ON public.profiles;

-- Create a secure policy that requires authentication
CREATE POLICY "Authenticated users can view non-blocked profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = id 
    OR (
      NOT is_blocked(id, auth.uid()) 
      AND NOT is_blocked(auth.uid(), id)
    )
  )
);

-- Create a function for safely fetching public hometown data for the map
-- This only returns non-sensitive fields needed for the IRL Layer map
CREATE OR REPLACE FUNCTION public.get_public_hometowns()
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  hometown_city text,
  hometown_country text,
  hometown_latitude double precision,
  hometown_longitude double precision,
  hometown_description text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.hometown_city,
    p.hometown_country,
    p.hometown_latitude,
    p.hometown_longitude,
    p.hometown_description
  FROM public.profiles p
  WHERE p.hometown_city IS NOT NULL
    AND (
      auth.uid() IS NULL 
      OR auth.uid() = p.id 
      OR (
        NOT is_blocked(p.id, auth.uid()) 
        AND NOT is_blocked(auth.uid(), p.id)
      )
    );
$$;