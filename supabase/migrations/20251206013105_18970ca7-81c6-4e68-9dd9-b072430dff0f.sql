-- Add a column to track if the user needs to set their friendship level
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS needs_level_set boolean NOT NULL DEFAULT false;

-- Update the accept_friend_request function to mark the reverse friendship as needing level set
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid, friendship_level friendship_level)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_from_user_id uuid;
  v_to_user_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Get the friend request and verify the current user is the recipient
  SELECT from_user_id, to_user_id INTO v_from_user_id, v_to_user_id
  FROM public.friend_requests
  WHERE id = request_id AND to_user_id = v_current_user_id;
  
  IF v_from_user_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or you are not the recipient';
  END IF;
  
  -- For "not_friend", just delete the request
  IF friendship_level = 'not_friend' THEN
    DELETE FROM public.friend_requests WHERE id = request_id;
    RETURN;
  END IF;
  
  -- Create friendship for the accepting user (already set their level)
  INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
  VALUES (v_current_user_id, v_from_user_id, friendship_level, false)
  ON CONFLICT (user_id, friend_id) DO UPDATE SET level = EXCLUDED.level, needs_level_set = false;
  
  -- For fake_friend, don't create reverse friendship
  IF friendship_level != 'fake_friend' THEN
    -- Create reverse friendship for the requester - they need to set their level
    INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
    VALUES (v_from_user_id, v_current_user_id, 'buddy', true)
    ON CONFLICT (user_id, friend_id) DO UPDATE SET needs_level_set = true;
  END IF;
  
  -- Delete the friend request
  DELETE FROM public.friend_requests WHERE id = request_id;
END;
$function$;