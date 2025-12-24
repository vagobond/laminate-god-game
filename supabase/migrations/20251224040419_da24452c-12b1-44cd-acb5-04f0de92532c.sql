-- Ensure meetup/hosting preferences are visible to logged-out viewers when user opted in,
-- and avoid multiple SELECT policies interacting in unexpected ways.

-- Drop ALL existing SELECT policies on meetup_preferences
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'meetup_preferences'
      AND cmd = 'SELECT'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.meetup_preferences', r.policyname);
  END LOOP;
END $$;

-- Drop ALL existing SELECT policies on hosting_preferences
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hosting_preferences'
      AND cmd = 'SELECT'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.hosting_preferences', r.policyname);
  END LOOP;
END $$;

-- Create a single clear SELECT policy for meetup_preferences (anon + authenticated)
CREATE POLICY "Public can view open meetup preferences"
ON public.meetup_preferences
AS PERMISSIVE
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR (
    is_open_to_meetups = true
    AND (
      auth.uid() IS NULL
      OR (
        NOT is_blocked(user_id, auth.uid())
        AND NOT is_blocked(auth.uid(), user_id)
      )
    )
  )
);

-- Create a single clear SELECT policy for hosting_preferences (anon + authenticated)
CREATE POLICY "Public can view open hosting preferences"
ON public.hosting_preferences
AS PERMISSIVE
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR (
    is_open_to_hosting = true
    AND (
      auth.uid() IS NULL
      OR (
        NOT is_blocked(user_id, auth.uid())
        AND NOT is_blocked(auth.uid(), user_id)
      )
    )
  )
);