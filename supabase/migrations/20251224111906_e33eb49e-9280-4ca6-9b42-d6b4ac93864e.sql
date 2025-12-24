-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own custom type" ON public.custom_friendship_types;
DROP POLICY IF EXISTS "Users can create their own custom type" ON public.custom_friendship_types;
DROP POLICY IF EXISTS "Users can update their own custom type" ON public.custom_friendship_types;
DROP POLICY IF EXISTS "Users can delete their own custom type" ON public.custom_friendship_types;

-- Recreate as permissive policies
CREATE POLICY "Users can view their own custom type"
ON public.custom_friendship_types FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom type"
ON public.custom_friendship_types FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom type"
ON public.custom_friendship_types FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom type"
ON public.custom_friendship_types FOR DELETE
TO authenticated
USING (auth.uid() = user_id);