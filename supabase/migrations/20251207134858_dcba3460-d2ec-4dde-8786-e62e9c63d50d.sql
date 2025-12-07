-- Add unique constraint on user_id for wolfemon_game_state to enable proper upsert
ALTER TABLE public.wolfemon_game_state ADD CONSTRAINT wolfemon_game_state_user_id_key UNIQUE (user_id);