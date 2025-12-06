-- Create a function to accept a friend request with proper permissions
-- This uses SECURITY DEFINER to allow creating the reverse friendship
CREATE OR REPLACE FUNCTION public.accept_friend_request(
  request_id uuid,
  friendship_level friendship_level
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
  
  -- Create friendship for the accepting user
  INSERT INTO public.friendships (user_id, friend_id, level)
  VALUES (v_current_user_id, v_from_user_id, friendship_level)
  ON CONFLICT DO NOTHING;
  
  -- For fake_friend, don't create reverse friendship
  IF friendship_level != 'fake_friend' THEN
    -- Create reverse friendship for the requester (default to buddy)
    INSERT INTO public.friendships (user_id, friend_id, level)
    VALUES (v_from_user_id, v_current_user_id, 'buddy')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Delete the friend request
  DELETE FROM public.friend_requests WHERE id = request_id;
END;
$$;