-- Create table to track unique death causes for each user
CREATE TABLE public.game_deaths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  death_cause TEXT NOT NULL,
  scenario_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_deaths ENABLE ROW LEVEL SECURITY;

-- Users can view their own deaths
CREATE POLICY "Users can view their own deaths"
ON public.game_deaths
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own deaths
CREATE POLICY "Users can insert their own deaths"
ON public.game_deaths
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_game_deaths_user_id ON public.game_deaths(user_id);

-- Create table for game sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  survival_streak INTEGER NOT NULL DEFAULT 0,
  total_scenarios INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.game_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.game_sessions
FOR UPDATE
USING (auth.uid() = user_id);