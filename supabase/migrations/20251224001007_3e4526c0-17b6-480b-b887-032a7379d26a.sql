-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view public friendships" ON public.friendships;

-- Create a new PERMISSIVE policy that allows anyone (including unauthenticated users) to view public friendships
CREATE POLICY "Anyone can view public friendships" 
ON public.friendships 
FOR SELECT 
TO anon, authenticated
USING (level NOT IN ('secret_friend', 'fake_friend', 'secret_enemy'));