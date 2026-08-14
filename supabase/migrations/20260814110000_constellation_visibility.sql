-- Per-user opt-in for who can see named (interactive) constellation.
-- Default 'nobody': everyone sees anonymous dots. User can raise the
-- threshold so friends at or above a chosen level see names + links.

ALTER TABLE profiles
  ADD COLUMN constellation_visibility text NOT NULL DEFAULT 'nobody'
  CHECK (constellation_visibility IN (
    'nobody', 'close_friend', 'family', 'buddy', 'friendly_acquaintance', 'everyone'
  ));

-- This column is a user preference, not PII, so grant direct SELECT
-- (same approach as other non-sensitive profile columns in the lockdown migration).
GRANT SELECT (constellation_visibility) ON public.profiles TO anon, authenticated;
-- Authenticated users can UPDATE their own row (existing RLS handles row ownership).
GRANT UPDATE (constellation_visibility) ON public.profiles TO authenticated;
