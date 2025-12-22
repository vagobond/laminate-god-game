-- Drop the existing username constraint and add new one with 1-char minimum alphanumeric only
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_username;

-- Add new constraint: 1+ alphanumeric characters only (case insensitive is handled by lowercase storage)
ALTER TABLE public.profiles ADD CONSTRAINT valid_username 
  CHECK (username IS NULL OR (length(username) >= 1 AND username ~ '^[a-z0-9_]+$'));