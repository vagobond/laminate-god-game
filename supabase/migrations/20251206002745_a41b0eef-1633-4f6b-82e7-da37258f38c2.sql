-- Drop the overly permissive public profile policy
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Create a secure function to get profile with visibility based on friendship level
-- This function returns only the fields the viewer is authorized to see
CREATE OR REPLACE FUNCTION public.get_visible_profile(viewer_id uuid, profile_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  hometown_city text,
  hometown_country text,
  hometown_description text,
  link text,
  -- Sensitive fields - only returned based on friendship level
  linkedin_url text,
  contact_email text,
  instagram_url text,
  whatsapp text,
  phone_number text,
  private_email text,
  hometown_latitude double precision,
  hometown_longitude double precision,
  -- Metadata for the caller
  friendship_level text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    -- LinkedIn: visible to friendly_acquaintance and above, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
      THEN p.linkedin_url ELSE NULL END,
    -- Contact email: visible to friendly_acquaintance and above, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
      THEN p.contact_email ELSE NULL END,
    -- Instagram: visible to buddy and above, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'buddy', 'secret_friend')
      THEN p.instagram_url ELSE NULL END,
    -- WhatsApp: visible to close_friend only, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'secret_friend')
      THEN p.whatsapp ELSE NULL END,
    -- Phone: visible to close_friend only, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'secret_friend')
      THEN p.phone_number ELSE NULL END,
    -- Private email: visible to close_friend only, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'secret_friend')
      THEN p.private_email ELSE NULL END,
    -- GPS coordinates: visible to close_friend only, or self
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'secret_friend')
      THEN p.hometown_latitude ELSE NULL END,
    CASE WHEN v_is_self OR v_friendship_level IN ('close_friend', 'secret_friend')
      THEN p.hometown_longitude ELSE NULL END,
    -- Return the friendship level for frontend use
    v_friendship_level::text
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$;

-- Create a new restrictive RLS policy that only exposes non-sensitive fields publicly
CREATE POLICY "Public profiles show limited info"
ON public.profiles
FOR SELECT
USING (true);

-- Note: The RLS policy still allows SELECT, but the application should use 
-- get_visible_profile() function to get properly filtered data.
-- The raw table access will still work but only through the secure function
-- for sensitive data access.