-- Create table for resolution game state
CREATE TABLE public.resolution_game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resolutions_made INTEGER NOT NULL DEFAULT 0,
  resolutions_broken INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.resolution_game_state ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own game state"
ON public.resolution_game_state
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state"
ON public.resolution_game_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state"
ON public.resolution_game_state
FOR UPDATE
USING (auth.uid() = user_id);