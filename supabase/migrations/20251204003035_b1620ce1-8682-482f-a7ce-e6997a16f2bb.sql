-- Drop the existing hometown-only policy and create a broader public profile viewing policy
DROP POLICY IF EXISTS "Anyone can view hometown data" ON public.profiles;

-- Allow anyone to view public profile data (display_name, avatar_url, bio, link, hometown info)
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
USING (true);