-- Allow anyone to view hometown data from profiles (for the map)
CREATE POLICY "Anyone can view hometown data"
ON public.profiles
FOR SELECT
USING (
  hometown_city IS NOT NULL
);