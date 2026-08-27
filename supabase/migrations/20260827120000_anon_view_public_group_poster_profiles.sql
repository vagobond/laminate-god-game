-- Author names on public-group posts for anonymous viewers (CD decision 2026-08-27).
-- Anon could read posts in public groups but not the posters' profiles unless
-- the poster had a public entry — so authors rendered as "Unknown"
-- (observed: markfindlater in The Tavern). Mirror the group_posts anon gate.
-- NOTE: row-level like the existing anon policy; the client selects only
-- id/display_name/avatar_url/username. Column-level anon hardening across both
-- anon policies is a separate future item.
CREATE POLICY "Anon can view profiles of public group posters"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.user_id = profiles.id
      AND public.is_public_group(gp.group_id)
  )
);
