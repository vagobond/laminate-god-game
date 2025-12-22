-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add constraint to ensure usernames are lowercase and valid format
ALTER TABLE public.profiles
ADD CONSTRAINT valid_username CHECK (
  username IS NULL OR (
    username ~ '^[a-z0-9_]+$' 
    AND length(username) >= 3 
    AND length(username) <= 30
  )
);