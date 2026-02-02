
-- Fix INSERT policy for user_references:
-- 1) Include 'family' as an eligible friendship level
-- 2) Correctly scope meetup/hosting interaction checks to the two users involved

DROP POLICY IF EXISTS "Users can create references for friends or after interaction" ON public.user_references;

CREATE POLICY "Users can create references for friends or after interaction"
ON public.user_references
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = from_user_id
  AND from_user_id <> to_user_id
  AND NOT is_blocked(to_user_id, from_user_id)
  AND NOT is_blocked(from_user_id, to_user_id)
  AND (
    -- Friends (Buddy and above, plus Family)
    EXISTS (
      SELECT 1
      FROM public.friendships f
      WHERE f.user_id = from_user_id
        AND f.friend_id = to_user_id
        AND f.level = ANY (ARRAY[
          'family'::public.friendship_level,
          'close_friend'::public.friendship_level,
          'buddy'::public.friendship_level,
          'secret_friend'::public.friendship_level
        ])
    )
    OR (
      -- After an accepted hosting interaction (Host/Guest references)
      reference_type = ANY (ARRAY['host'::public.reference_type, 'guest'::public.reference_type])
      AND EXISTS (
        SELECT 1
        FROM public.hosting_requests hr
        WHERE hr.status = 'accepted'::public.request_status
          AND (
            (hr.from_user_id = from_user_id AND hr.to_user_id = to_user_id)
            OR (hr.from_user_id = to_user_id AND hr.to_user_id = from_user_id)
          )
      )
    )
    OR (
      -- After an accepted meetup interaction (Friendly references)
      reference_type = 'friendly'::public.reference_type
      AND EXISTS (
        SELECT 1
        FROM public.meetup_requests mr
        WHERE mr.status = 'accepted'::public.request_status
          AND (
            (mr.from_user_id = from_user_id AND mr.to_user_id = to_user_id)
            OR (mr.from_user_id = to_user_id AND mr.to_user_id = from_user_id)
          )
      )
    )
  )
);
