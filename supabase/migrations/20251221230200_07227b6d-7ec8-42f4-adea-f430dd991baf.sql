-- Add missing personal info fields and visibility columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birthday_day integer,
ADD COLUMN IF NOT EXISTS birthday_month integer,
ADD COLUMN IF NOT EXISTS birthday_year integer,
ADD COLUMN IF NOT EXISTS home_address text,
ADD COLUMN IF NOT EXISTS mailing_address text,
ADD COLUMN IF NOT EXISTS nicknames text,
ADD COLUMN IF NOT EXISTS birthday_no_year_visibility text DEFAULT 'buddy' CHECK (birthday_no_year_visibility IN ('close_friend', 'buddy', 'friendly_acquaintance', 'nobody')),
ADD COLUMN IF NOT EXISTS birthday_year_visibility text DEFAULT 'close_friend' CHECK (birthday_year_visibility IN ('close_friend', 'buddy', 'friendly_acquaintance', 'nobody')),
ADD COLUMN IF NOT EXISTS home_address_visibility text DEFAULT 'close_friend' CHECK (home_address_visibility IN ('close_friend', 'buddy', 'friendly_acquaintance', 'nobody')),
ADD COLUMN IF NOT EXISTS mailing_address_visibility text DEFAULT 'close_friend' CHECK (mailing_address_visibility IN ('close_friend', 'buddy', 'friendly_acquaintance', 'nobody')),
ADD COLUMN IF NOT EXISTS nicknames_visibility text DEFAULT 'friendly_acquaintance' CHECK (nicknames_visibility IN ('close_friend', 'buddy', 'friendly_acquaintance', 'nobody'));