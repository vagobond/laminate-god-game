-- Add hometown fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN hometown_city text,
ADD COLUMN hometown_country text,
ADD COLUMN hometown_latitude double precision,
ADD COLUMN hometown_longitude double precision,
ADD COLUMN hometown_description text;

-- Add index for location queries
CREATE INDEX idx_profiles_hometown ON public.profiles(hometown_city, hometown_country) WHERE hometown_city IS NOT NULL;