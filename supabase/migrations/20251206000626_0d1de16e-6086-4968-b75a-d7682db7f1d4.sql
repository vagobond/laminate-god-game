-- Add new friendship levels: fake_friend and not_friend
ALTER TYPE friendship_level ADD VALUE IF NOT EXISTS 'fake_friend';
ALTER TYPE friendship_level ADD VALUE IF NOT EXISTS 'not_friend';

-- Create blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocks
CREATE POLICY "Users can view their own blocks"
ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others"
ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(blocker_id uuid, blocked_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE user_blocks.blocker_id = is_blocked.blocker_id
    AND user_blocks.blocked_id = is_blocked.blocked_id
  );
$$;