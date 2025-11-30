-- Create wolfemon game state table
CREATE TABLE public.wolfemon_game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sheep_count INTEGER NOT NULL DEFAULT 0,
  wool_count INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 100,
  total_sheep_collected INTEGER NOT NULL DEFAULT 0,
  has_wolfemon BOOLEAN NOT NULL DEFAULT false,
  last_action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wolfemon_game_state ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own game state"
ON public.wolfemon_game_state
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state"
ON public.wolfemon_game_state
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state"
ON public.wolfemon_game_state
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_wolfemon_game_state_updated_at
BEFORE UPDATE ON public.wolfemon_game_state
FOR EACH ROW
EXECUTE FUNCTION public.update_layer_updated_at();