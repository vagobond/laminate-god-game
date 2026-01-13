-- Migrate all fake_friend data to secret_enemy
UPDATE public.friendships 
SET level = 'secret_enemy' 
WHERE level = 'fake_friend';

-- Update social_links that use fake_friend
UPDATE public.social_links 
SET friendship_level_required = 'secret_enemy' 
WHERE friendship_level_required = 'fake_friend';

-- Update any RPC functions that reference fake_friend
-- First update get_visible_friends to handle the change
CREATE OR REPLACE FUNCTION public.get_visible_friends(profile_id uuid, viewer_id uuid)
 RETURNS TABLE(id uuid, friend_id uuid, level friendship_level, display_name text, avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  v_is_owner BOOLEAN := (viewer_id IS NOT NULL AND viewer_id = profile_id);
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.friend_id,
    f.level,
    p.display_name,
    p.avatar_url
  FROM friendships f
  LEFT JOIN profiles p ON p.id = f.friend_id
  WHERE f.user_id = profile_id
    AND (
      v_is_owner
      OR f.level NOT IN ('secret_friend', 'secret_enemy')
    )
  ORDER BY f.created_at DESC;
END;
$function$;

-- Update accept_friend_request to handle the change (fake_friend logic is now just secret_enemy)
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid, friendship_level friendship_level)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public
AS $function$
DECLARE
  v_from_user_id UUID;
  v_to_user_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  v_current_user_id := auth.uid();
  
  -- Get the request details
  SELECT from_user_id, to_user_id INTO v_from_user_id, v_to_user_id
  FROM public.friend_requests
  WHERE id = request_id;
  
  -- Verify the current user is the recipient
  IF v_current_user_id != v_to_user_id THEN
    RAISE EXCEPTION 'Only the request recipient can accept this request';
  END IF;
  
  -- Handle not_friend as a decline
  IF friendship_level = 'not_friend' THEN
    DELETE FROM public.friend_requests WHERE id = request_id;
    RETURN;
  END IF;
  
  -- Delete the friend request
  DELETE FROM public.friend_requests WHERE id = request_id;
  
  -- Create friendship record for the acceptor (who chose the level)
  INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
  VALUES (v_to_user_id, v_from_user_id, friendship_level, false)
  ON CONFLICT (user_id, friend_id) DO UPDATE SET level = EXCLUDED.level, needs_level_set = false;
  
  -- For secret_enemy, don't create reverse friendship (one-way like old fake_friend)
  IF friendship_level NOT IN ('secret_enemy') THEN
    -- Create reverse friendship for the requester - they need to set their level
    INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
    VALUES (v_from_user_id, v_to_user_id, 'buddy', true)
    ON CONFLICT (user_id, friend_id) DO UPDATE SET needs_level_set = true;
  END IF;
END;
$function$;