-- Allow anyone to view friendships (the code already filters out secret categories)
CREATE POLICY "Anyone can view public friendships"
ON public.friendships
FOR SELECT
USING (
  level NOT IN ('secret_friend', 'fake_friend', 'secret_enemy')
);