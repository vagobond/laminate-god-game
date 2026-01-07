-- Modify accept_friend_request to preserve the message from the friend request
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  request_id uuid,
  friendship_level public.friendship_level
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id uuid;
  v_to_user_id uuid;
  v_current_user_id uuid;
  v_message text;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Get the friend request and verify the current user is the recipient
  SELECT from_user_id, to_user_id, message INTO v_from_user_id, v_to_user_id, v_message
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
  
  -- Preserve the message if it exists by copying it to the messages table
  IF v_message IS NOT NULL AND v_message != '' THEN
    INSERT INTO public.messages (from_user_id, to_user_id, content, platform_suggestion)
    VALUES (v_from_user_id, v_current_user_id, v_message, null);
  END IF;
  
  -- Create friendship for the accepting user (already set their level)
  INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
  VALUES (v_current_user_id, v_from_user_id, friendship_level, false)
  ON CONFLICT (user_id, friend_id) DO UPDATE SET level = EXCLUDED.level, needs_level_set = false;
  
  -- For fake_friend or secret_enemy, don't create reverse friendship
  IF friendship_level NOT IN ('fake_friend', 'secret_enemy') THEN
    -- Create reverse friendship for the requester - they need to set their level
    INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
    VALUES (v_from_user_id, v_current_user_id, 'buddy', true)
    ON CONFLICT (user_id, friend_id) DO UPDATE SET needs_level_set = true;
  END IF;
  
  -- Delete the friend request
  DELETE FROM public.friend_requests WHERE id = request_id;
END;
$$;