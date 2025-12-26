-- Add policy for public entries to be viewable by anyone
CREATE POLICY "Anyone can view public entries"
ON public.xcrol_entries
FOR SELECT
USING (privacy_level = 'public');