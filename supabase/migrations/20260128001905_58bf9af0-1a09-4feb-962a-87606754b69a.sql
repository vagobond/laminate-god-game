-- Create tutorial completion tracking table
CREATE TABLE public.tutorial_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  skipped BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.tutorial_completion ENABLE ROW LEVEL SECURITY;

-- Users can view their own completion status
CREATE POLICY "Users can view own tutorial status"
  ON public.tutorial_completion
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completion record
CREATE POLICY "Users can mark tutorial complete"
  ON public.tutorial_completion
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own record (for re-enabling)
CREATE POLICY "Users can update own tutorial status"
  ON public.tutorial_completion
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own record (to re-enable tutorial)
CREATE POLICY "Users can delete own tutorial status"
  ON public.tutorial_completion
  FOR DELETE
  USING (auth.uid() = user_id);