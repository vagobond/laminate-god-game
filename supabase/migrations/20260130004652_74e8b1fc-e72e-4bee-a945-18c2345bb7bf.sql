-- Add invite_verified column to track if user has provided a valid invite code
ALTER TABLE public.profiles ADD COLUMN invite_verified boolean NOT NULL DEFAULT false;

-- Mark all existing users as verified (they were already in the system before this change)
UPDATE public.profiles SET invite_verified = true;