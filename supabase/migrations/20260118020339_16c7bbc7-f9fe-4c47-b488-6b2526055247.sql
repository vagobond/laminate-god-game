-- Fix the SECURITY DEFINER view warning by recreating as regular view (SECURITY INVOKER is default)
DROP VIEW IF EXISTS public.oauth_clients_public;

-- Recreate view without SECURITY DEFINER (uses invoker's permissions by default)
CREATE VIEW public.oauth_clients_public 
WITH (security_invoker = true)
AS
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

-- Grant access to the view for unauthenticated and authenticated users
GRANT SELECT ON public.oauth_clients_public TO anon, authenticated;