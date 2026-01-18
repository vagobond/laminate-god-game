-- The ConnectedAppsManager joins oauth_user_authorizations with oauth_clients
-- But now oauth_clients is restricted to owners only
-- We need to allow users to see basic info about apps they've authorized

-- Drop and recreate with proper RLS
DROP POLICY IF EXISTS "Only owners can read full app details" ON public.oauth_clients;

-- Create policy that allows:
-- 1. Owners to see everything (their own apps)
-- 2. Users who have authorized the app to see non-secret fields
CREATE POLICY "Owners can read their own apps"
ON public.oauth_clients FOR SELECT
USING (auth.uid() = owner_id);

-- For users who have authorized an app, they can see it via the view
-- The view doesn't expose client_secret and uses SECURITY INVOKER
-- but the RLS on oauth_clients will block access
-- So we need a function to get authorized app info

CREATE OR REPLACE FUNCTION public.get_authorized_app_info(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  logo_url text,
  homepage_url text,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return if user has authorized this app
  IF NOT EXISTS (
    SELECT 1 FROM public.oauth_user_authorizations
    WHERE user_id = auth.uid() AND client_id = p_client_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    oc.id,
    oc.name,
    oc.description,
    oc.logo_url,
    oc.homepage_url,
    oc.is_verified
  FROM public.oauth_clients oc
  WHERE oc.id = p_client_id;
END;
$$;