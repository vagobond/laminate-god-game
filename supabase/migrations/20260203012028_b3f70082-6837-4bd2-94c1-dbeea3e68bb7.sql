
-- Fix security warning: Remove materialized view from public API access
-- The friendship_pairs view should only be accessed by security definer functions

REVOKE ALL ON public.friendship_pairs FROM anon, authenticated;

-- Grant access only to postgres role (for internal function use)
GRANT SELECT ON public.friendship_pairs TO postgres;
