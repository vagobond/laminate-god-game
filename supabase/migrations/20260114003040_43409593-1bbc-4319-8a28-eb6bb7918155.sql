-- Add 'family' to the friendship_level enum
ALTER TYPE public.friendship_level ADD VALUE 'family' AFTER 'close_friend';

-- Update get_visible_profile function to handle family level
CREATE OR REPLACE FUNCTION public.get_visible_profile(viewer_id uuid, profile_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, hometown_city text, hometown_country text, hometown_description text, link text, linkedin_url text, contact_email text, instagram_url text, whatsapp text, phone_number text, private_email text, hometown_latitude double precision, hometown_longitude double precision, friendship_level text, birthday_day integer, birthday_month integer, birthday_year integer, home_address text, mailing_address text, nicknames text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_friendship_level friendship_level;
  v_is_self boolean;
  v_is_blocked boolean;
BEGIN
  -- Check if viewing own profile
  v_is_self := (viewer_id = profile_id);
  
  -- Check if blocked (only if viewer is authenticated)
  IF viewer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_blocks
      WHERE (blocker_id = profile_id AND blocked_id = viewer_id)
         OR (blocker_id = viewer_id AND blocked_id = profile_id)
    ) INTO v_is_blocked;
    
    -- If blocked, return nothing
    IF v_is_blocked AND NOT v_is_self THEN
      RETURN;
    END IF;
  END IF;
  
  -- Get friendship level if viewer is authenticated and not viewing self
  IF viewer_id IS NOT NULL AND NOT v_is_self THEN
    SELECT f.level INTO v_friendship_level
    FROM public.friendships f
    WHERE f.user_id = profile_id AND f.friend_id = viewer_id
    LIMIT 1;
  END IF;
  
  -- Return profile with appropriate fields based on access level
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
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.linkedin_url ELSE NULL END,
    -- Contact email: visible to friendly_acquaintance and above, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.contact_email ELSE NULL END,
    -- Instagram: visible to buddy and above, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.instagram_url ELSE NULL END,
    -- WhatsApp: visible to close_friend and family only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.whatsapp ELSE NULL END,
    -- Phone: visible to close_friend and family only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.phone_number ELSE NULL END,
    -- Private email: visible to close_friend and family only, or self (NOT secret_enemy)
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'family', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.private_email ELSE NULL END,
    -- GPS coordinates: visible to close_friend only, or self (NOT secret_enemy) - Family does NOT get coords by default
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.hometown_latitude ELSE NULL END,
    CASE WHEN v_is_self OR (v_friendship_level IN ('close_friend', 'secret_friend') AND v_friendship_level != 'secret_enemy')
      THEN p.hometown_longitude ELSE NULL END,
    -- Return the friendship level for frontend use
    v_friendship_level::text,
    -- Birthday day/month: Family gets full birthday by default, others based on visibility setting
    CASE WHEN v_is_self OR (v_friendship_level = 'family' AND v_friendship_level != 'secret_enemy') OR (
      p.birthday_no_year_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.birthday_no_year_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.birthday_no_year_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.birthday_no_year_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.birthday_day ELSE NULL END,
    CASE WHEN v_is_self OR (v_friendship_level = 'family' AND v_friendship_level != 'secret_enemy') OR (
      p.birthday_no_year_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.birthday_no_year_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.birthday_no_year_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.birthday_no_year_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.birthday_month ELSE NULL END,
    -- Birthday year: Family gets full birthday by default, others based on visibility setting
    CASE WHEN v_is_self OR (v_friendship_level = 'family' AND v_friendship_level != 'secret_enemy') OR (
      p.birthday_year_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.birthday_year_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.birthday_year_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.birthday_year_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.birthday_year ELSE NULL END,
    -- Home address: based on user's visibility setting
    CASE WHEN v_is_self OR (
      p.home_address_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.home_address_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.home_address_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.home_address_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.home_address ELSE NULL END,
    -- Mailing address: based on user's visibility setting
    CASE WHEN v_is_self OR (
      p.mailing_address_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.mailing_address_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.mailing_address_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.mailing_address_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.mailing_address ELSE NULL END,
    -- Nicknames: based on user's visibility setting
    CASE WHEN v_is_self OR (
      p.nicknames_visibility != 'nobody' AND
      v_friendship_level IS NOT NULL AND
      v_friendship_level != 'secret_enemy' AND
      (
        (p.nicknames_visibility = 'friendly_acquaintance' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
        (p.nicknames_visibility = 'buddy' AND v_friendship_level IN ('close_friend', 'family', 'buddy', 'secret_friend')) OR
        (p.nicknames_visibility = 'close_friend' AND v_friendship_level IN ('close_friend', 'family', 'secret_friend'))
      )
    ) THEN p.nicknames ELSE NULL END
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$function$;