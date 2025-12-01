-- Create table for Art I Fucked game state
CREATE TABLE public.art_i_fucked_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sharts_collected INTEGER NOT NULL DEFAULT 0,
  encounters_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.art_i_fucked_state ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own game state" 
ON public.art_i_fucked_state 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state" 
ON public.art_i_fucked_state 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state" 
ON public.art_i_fucked_state 
FOR UPDATE 
USING (auth.uid() = user_id);