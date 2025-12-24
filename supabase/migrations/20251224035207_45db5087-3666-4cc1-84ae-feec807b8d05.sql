-- Drop existing restrictive SELECT policies for meetup_preferences
DROP POLICY IF EXISTS "Friends can view meetup preferences based on level" ON public.meetup_preferences;

-- Create new policy allowing all authenticated non-blocked users to view
CREATE POLICY "Authenticated users can view open meetup preferences"
ON public.meetup_preferences
FOR SELECT
USING (
  (auth.uid() = user_id) -- Own preferences
  OR (
    is_open_to_meetups = true
    AND auth.uid() IS NOT NULL
    AND NOT is_blocked(user_id, auth.uid())
    AND NOT is_blocked(auth.uid(), user_id)
  )
);

-- Drop existing restrictive SELECT policies for hosting_preferences
DROP POLICY IF EXISTS "Friends can view hosting preferences based on level" ON public.hosting_preferences;

-- Create new policy allowing all authenticated non-blocked users to view
CREATE POLICY "Authenticated users can view open hosting preferences"
ON public.hosting_preferences
FOR SELECT
USING (
  (auth.uid() = user_id) -- Own preferences
  OR (
    is_open_to_hosting = true
    AND auth.uid() IS NOT NULL
    AND NOT is_blocked(user_id, auth.uid())
    AND NOT is_blocked(auth.uid(), user_id)
  )
);

-- Update meetup_requests INSERT policy to require friendly_acquaintance level
DROP POLICY IF EXISTS "Users can create meetup requests" ON public.meetup_requests;

CREATE POLICY "Users can create meetup requests"
ON public.meetup_requests
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id
  AND NOT is_blocked(to_user_id, from_user_id)
  AND NOT is_blocked(from_user_id, to_user_id)
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = meetup_requests.to_user_id
    AND f.friend_id = auth.uid()
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  )
);

-- Update hosting_requests INSERT policy to require friendly_acquaintance level
DROP POLICY IF EXISTS "Users can create hosting requests" ON public.hosting_requests;

CREATE POLICY "Users can create hosting requests"
ON public.hosting_requests
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id
  AND NOT is_blocked(to_user_id, from_user_id)
  AND NOT is_blocked(from_user_id, to_user_id)
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = hosting_requests.to_user_id
    AND f.friend_id = auth.uid()
    AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
  )
);