-- Update get_visible_profile to treat secret_enemy like not_friend (no real contact info)
CREATE OR REPLACE FUNCTION public.get_visible_profile(viewer_id uuid, profile_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, hometown_city text, hometown_country text, hometown_description text, link text, linkedin_url text, contact_email text, instagram_url text, whatsapp text, phone_number text, private_email text, hometown_latitude double precision, hometown_longitude double precision, friendship_level text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_friendship_level friendship_level;
  v_is_self boolean;
  v_is_blocked boolean;
BEGIN
  -- Check if viewing own profile
  v_is_self := (viewer_id = profile_id);
  
  -- Check if blocked
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = profile_id AND blocked_id = viewer_id)
       OR (blocker_id = viewer_id AND blocked_id = profile_id)
  ) INTO v_is_blocked;
  
  -- If blocked, return nothing
  IF v_is_blocked AND NOT v_is_self THEN
    RETURN;
  END IF;
  
  -- Get friendship level if viewer is authenticated and not viewing self
  IF viewer_id IS NOT NULL AND NOT v_is_self THEN
    SELECT f.level INTO v_friendship_level
    FROM public.friendships f
    WHERE f.user_id = profile_id AND f.friend_id = viewer_id
    LIMIT 1;
  END IF;
  
  -- Return profile with appropriate fields based on access level
  -- secret_enemy gets NO real contact info (treated like not_friend)
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.hometown_city,
    p.hometown_country,
    p.hometown_description,
    p.link,
    -- LinkedIn: visible to friendly_acquaintance and above, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.linkedin_url ELSE NULL END,
    -- Contact email: visible to friendly_acquaintance and above, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.contact_email ELSE NULL END,
    -- Instagram: visible to buddy and above, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'buddy', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.instagram_url ELSE NULL END,
    -- WhatsApp: visible to close_friend only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.whatsapp ELSE NULL END,
    -- Phone: visible to close_friend only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.phone_number ELSE NULL END,
    -- Private email: visible to close_friend only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.private_email ELSE NULL END,
    -- GPS coordinates: visible to close_friend only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.hometown_latitude ELSE NULL END,
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.hometown_longitude ELSE NULL END,
    -- Return the friendship level for frontend use
    v_friendship_level::text
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$function$;

-- Update accept_friend_request to handle secret_enemy (creates one-way friendship like fake_friend)
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
$function$;