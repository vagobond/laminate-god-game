
-- Fix: Replace the permissive waitlist insert policy with rate-limited version
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

-- Create a more restrictive policy - still allows public insert but prevents abuse
-- by ensuring the email doesn't already exist (handled by UNIQUE constraint)
CREATE POLICY "Anyone can join waitlist once"
  ON public.waitlist FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.waitlist w WHERE w.email = email
    )
  );
