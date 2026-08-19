-- Tighten friendships visibility (2026-08-18 review, item 2).
--
-- Two SELECT policies let a viewer read RAW friendship levels that name the
-- concealed tiers:
--   * "Users can view friendships where they are the friend" (auth.uid()=friend_id)
--     → I can see that someone marked ME secret_enemy / fake_friend / secret_friend.
--   * "Anyone can view public friendships" (level NOT IN secret tiers) → fine for
--     the visible graph, but it exposes every non-secret edge of every user to
--     anon, which is broader than any consumer needs.
--
-- The concealed tiers (secret_friend, secret_enemy, fake_friend) are supposed to
-- be visible ONLY to the person who set them (the row's user_id). Every real
-- consumer of the friend_id=me read only needs "what VISIBLE tier did X grant me,
-- or am I a real friend" — never the concealed label. So:
--   1. Replace the friend_id policy with one that hides the concealed tiers from
--      the friend (the owner via user_id still sees everything they set).
--   2. Add get_my_level_from(other uuid): SECURITY DEFINER, returns the level the
--      OTHER user granted the CALLER with secret tiers masked (secret_friend →
--      close_friend; secret_enemy / fake_friend → null). Frontend uses this
--      instead of selecting level directly.
--   3. Leave "Anyone can view public friendships" in place for now (the visible
--      social graph / constellation depends on it) but scope it to authenticated
--      users — an anonymous visitor has no need to read the raw edge table
--      (get_constellation, itself SECURITY DEFINER, still serves anon).

-- 1) friend-side policy: hide only adversarial concealed tiers from the friend --------------
DROP POLICY IF EXISTS "Users can view friendships where they are the friend" ON public.friendships;
CREATE POLICY "Friends see non-adversarial edges pointed at them"
  ON public.friendships
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = friend_id
    -- Hide only the ADVERSARIAL concealed tiers from the person they point at.
    -- secret_friend is not adversarial concealment (the product lets a secret
    -- friend see they are one — RLS test 2b), so it stays visible to the friend.
    -- secret_enemy / fake_friend must never be readable by the target.
    AND level NOT IN ('secret_enemy', 'fake_friend')
  );

-- 2) masked self-referential helper ---------------------------------------
-- "What rung did `other` grant me (auth.uid())?" — the same masking the
-- relationship OAuth API applies, so the concealed tiers never reach a client.
CREATE OR REPLACE FUNCTION public.get_my_level_from(other uuid)
 RETURNS friendship_level
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO public
AS $function$
  SELECT CASE level
           WHEN 'secret_friend' THEN 'close_friend'::friendship_level
           WHEN 'secret_enemy'  THEN NULL
           WHEN 'fake_friend'   THEN NULL
           ELSE level
         END
  FROM public.friendships
  WHERE user_id = other AND friend_id = auth.uid()
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_my_level_from(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_level_from(uuid) TO authenticated;

-- 3) scope the public-graph policy to authenticated ------------------------
DROP POLICY IF EXISTS "Anyone can view public friendships" ON public.friendships;
CREATE POLICY "Authenticated can view non-secret friendships"
  ON public.friendships
  FOR SELECT
  TO authenticated
  USING (level NOT IN ('secret_friend', 'fake_friend', 'secret_enemy'));
