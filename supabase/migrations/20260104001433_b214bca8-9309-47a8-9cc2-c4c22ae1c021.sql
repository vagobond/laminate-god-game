-- Allow anyone to validate invite codes during signup (by invite_code only)
CREATE POLICY "Anyone can validate invite codes" 
ON public.country_invites 
FOR SELECT 
USING (true);

-- Drop the old restrictive select policy
DROP POLICY "Users can view their own invites" ON public.country_invites;