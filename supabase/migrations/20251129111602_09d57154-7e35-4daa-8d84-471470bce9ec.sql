-- Fix RLS policies for game_sessions to allow inserts
DROP POLICY IF EXISTS "Users can view their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can update their own game sessions" ON public.game_sessions;

CREATE POLICY "Users can view their own game sessions"
ON public.game_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions"
ON public.game_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Fix RLS policies for game_deaths to allow inserts
DROP POLICY IF EXISTS "Users can view their own deaths" ON public.game_deaths;
DROP POLICY IF EXISTS "Users can insert their own deaths" ON public.game_deaths;

CREATE POLICY "Users can view their own deaths"
ON public.game_deaths FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deaths"
ON public.game_deaths FOR INSERT
WITH CHECK (auth.uid() = user_id);