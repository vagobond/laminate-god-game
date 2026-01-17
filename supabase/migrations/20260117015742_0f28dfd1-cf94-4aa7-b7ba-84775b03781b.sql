-- Add last_hometown_change column to track when users can change their hometown (every 90 days)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_hometown_change timestamptz;

-- Add link column to brook_posts if not already present (for optional links like in xcrol entries)
-- The table already has a link column based on types.ts, so this is just a safety check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brook_posts' 
    AND column_name = 'link'
  ) THEN
    ALTER TABLE public.brook_posts ADD COLUMN link text;
  END IF;
END $$;