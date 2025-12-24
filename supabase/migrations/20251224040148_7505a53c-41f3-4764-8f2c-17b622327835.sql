-- Make meetup/hosting preferences readable to logged-out users when the owner opted in.
-- Keep block checks for authenticated viewers.

-- meetup_preferences
DROP POLICY IF EXISTS "Users can view meetup preferences" ON public.meetup_preferences;
DROP POLICY IF EXISTS "Authenticated users can view open meetup preferences" ON public.meetup_preferences;

CREATE POLICY "Anyone can view open meetup preferences"
ON public.meetup_preferences
FOR SELECT
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

-- hosting_preferences
DROP POLICY IF EXISTS "Users can view hosting preferences" ON public.hosting_preferences;
DROP POLICY IF EXISTS "Authenticated users can view open hosting preferences" ON public.hosting_preferences;

CREATE POLICY "Anyone can view open hosting preferences"
ON public.hosting_preferences
FOR SELECT
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