-- Check if users can view their own preferences policies exist, if not add them back
-- The new policies already include (auth.uid() = user_id) but let's ensure they work

-- Drop and recreate the hosting preferences SELECT policy to be clearer
DROP POLICY IF EXISTS "Authenticated users can view open hosting preferences" ON public.hosting_preferences;
DROP POLICY IF EXISTS "Users can view their own hosting preferences" ON public.hosting_preferences;

CREATE POLICY "Users can view hosting preferences"
ON public.hosting_preferences
FOR SELECT
USING (
  auth.uid() = user_id  -- Own preferences
  OR (
    is_open_to_hosting = true
    AND auth.uid() IS NOT NULL
    AND NOT is_blocked(user_id, auth.uid())
    AND NOT is_blocked(auth.uid(), user_id)
  )
);

-- Drop and recreate the meetup preferences SELECT policy  
DROP POLICY IF EXISTS "Authenticated users can view open meetup preferences" ON public.meetup_preferences;
DROP POLICY IF EXISTS "Users can view their own meetup preferences" ON public.meetup_preferences;

CREATE POLICY "Users can view meetup preferences"
ON public.meetup_preferences
FOR SELECT
USING (
  auth.uid() = user_id  -- Own preferences
  OR (
    is_open_to_meetups = true
    AND auth.uid() IS NOT NULL
    AND NOT is_blocked(user_id, auth.uid())
    AND NOT is_blocked(auth.uid(), user_id)
  )
);