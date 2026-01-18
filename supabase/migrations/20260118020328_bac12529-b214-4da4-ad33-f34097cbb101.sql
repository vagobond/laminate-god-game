-- Fix 1: country_invites - Restrict SELECT to only inviter and invitee (previously anyone could read)
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.country_invites;

-- Create a function for invite code validation that doesn't expose emails
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_invite_code text)
RETURNS TABLE(invite_id uuid, is_valid boolean, target_country text, is_new_country boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.status = 'pending',
    ci.target_country,
    ci.is_new_country
  FROM public.country_invites ci
  WHERE ci.invite_code = p_invite_code;
END;
$$;

-- Create restrictive policy - only inviter and invitee can see their invite records
CREATE POLICY "Users can view their own invites"
ON public.country_invites FOR SELECT
USING (
  auth.uid() = inviter_id 
  OR auth.uid() = invitee_id
);

-- Fix 2: oauth_clients - Hide client_secret from non-owners
-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read apps for authorization" ON public.oauth_clients;

-- Create a view for public OAuth client info (without secrets)
CREATE OR REPLACE VIEW public.oauth_clients_public AS
SELECT 
  id,
  name,
  description,
  logo_url,
  homepage_url,
  redirect_uris,
  client_id,
  is_verified,
  created_at,
  updated_at
FROM public.oauth_clients;

-- Grant access to the view
GRANT SELECT ON public.oauth_clients_public TO anon, authenticated;

-- Create a new restricted SELECT policy for the table itself
-- Only owners can see full record including client_secret
CREATE POLICY "Only owners can read full app details"
ON public.oauth_clients FOR SELECT
USING (auth.uid() = owner_id);