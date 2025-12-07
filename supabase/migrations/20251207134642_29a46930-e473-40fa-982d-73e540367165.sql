-- Create a separate table for Sly Doubt of Uranus game state
CREATE TABLE public.sly_doubt_game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bloot_collected INTEGER NOT NULL DEFAULT 0,
  revolution_acts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.sly_doubt_game_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own game state"
ON public.sly_doubt_game_state
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state"
ON public.sly_doubt_game_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state"
ON public.sly_doubt_game_state
FOR UPDATE
USING (auth.uid() = user_id);