-- Create a secure function to resolve username to user ID
-- This allows username lookup without requiring authentication
CREATE OR REPLACE FUNCTION public.resolve_username_to_id(target_username text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.profiles 
  WHERE username = lower(target_username)
  LIMIT 1;
$$;