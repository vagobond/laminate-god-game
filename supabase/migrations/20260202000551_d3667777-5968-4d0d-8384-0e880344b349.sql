
-- Update the use_invite_code function to also set invite_verified on the profile
CREATE OR REPLACE FUNCTION public.use_invite_code(p_invite_code uuid, p_user_id uuid, p_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find the pending invite
  SELECT * INTO invite_record
  FROM user_invites
  WHERE invite_code = p_invite_code AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update the invite to accepted
  UPDATE user_invites
  SET status = 'accepted',
      invitee_id = p_user_id,
      accepted_at = now()
  WHERE id = invite_record.id;
  
  -- Also mark the profile as invite_verified (this is the fix!)
  UPDATE profiles
  SET invite_verified = true
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$function$;
