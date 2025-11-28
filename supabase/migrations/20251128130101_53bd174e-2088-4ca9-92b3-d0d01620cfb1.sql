-- Fix security issues with RLS policies

-- 1. Fix profiles table: Restrict email visibility to profile owner only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view only their own profile (protects email addresses)
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Fix layer_relationships: Prevent users from creating arbitrary relationships
DROP POLICY IF EXISTS "Authenticated users can create relationships" ON public.layer_relationships;

-- Only allow users to create relationships for layers they own
CREATE POLICY "Users can create relationships for their own layers" ON public.layer_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.layers 
      WHERE id = child_layer_id AND user_id = auth.uid()
    )
  );

-- 3. Restrict refresh_layer_stats RPC to prevent abuse
-- This function should only be called by triggers, not directly by users
REVOKE EXECUTE ON FUNCTION public.refresh_layer_stats() FROM anon, authenticated;