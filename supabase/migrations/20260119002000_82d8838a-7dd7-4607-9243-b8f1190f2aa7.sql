-- First, drop existing RLS policies for user_references
DROP POLICY IF EXISTS "Users can read references about themselves" ON public.user_references;
DROP POLICY IF EXISTS "Users can read references they wrote" ON public.user_references;
DROP POLICY IF EXISTS "Anyone can read references" ON public.user_references;
DROP POLICY IF EXISTS "Public can read references" ON public.user_references;

-- Drop existing RLS policies for meetup_preferences
DROP POLICY IF EXISTS "Anyone can view meetup preferences" ON public.meetup_preferences;
DROP POLICY IF EXISTS "Users can view all meetup preferences" ON public.meetup_preferences;
DROP POLICY IF EXISTS "Public read for meetup preferences" ON public.meetup_preferences;

-- Create secure function to check if users are within 3 degrees of separation
CREATE OR REPLACE FUNCTION public.is_within_three_degrees(viewer_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result RECORD;
BEGIN
  -- If same user, return true
  IF viewer_id = target_id THEN
    RETURN true;
  END IF;
  
  -- Check connection degree (max 3)
  SELECT degree INTO result
  FROM public.get_connection_degree(viewer_id, target_id, 3);
  
  RETURN result.degree IS NOT NULL AND result.degree <= 3;
END;
$$;

-- Create new RLS policies for user_references
-- Users can always see references about themselves
CREATE POLICY "Users can read references about themselves" 
ON public.user_references 
FOR SELECT 
USING (auth.uid() = to_user_id);

-- Users can read references they wrote
CREATE POLICY "Users can read references they wrote" 
ON public.user_references 
FOR SELECT 
USING (auth.uid() = from_user_id);

-- Authenticated users can read references for users within 3 degrees
CREATE POLICY "Users can read references for connected users" 
ON public.user_references 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND public.is_within_three_degrees(auth.uid(), to_user_id)
);

-- Create new RLS policies for meetup_preferences
-- Only authenticated users can view meetup preferences
CREATE POLICY "Authenticated users can view meetup preferences" 
ON public.meetup_preferences 
FOR SELECT 
USING (auth.uid() IS NOT NULL);