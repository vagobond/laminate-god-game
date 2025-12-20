-- Create table for tracking country invites
CREATE TABLE public.country_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invite_code UUID NOT NULL DEFAULT gen_random_uuid(),
  target_country TEXT, -- For "existing country" invites, NULL for new country invites
  is_new_country BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, completed
  invitee_id UUID, -- Set when user signs up with this invite
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ, -- Set when invitee adds hometown
  UNIQUE(invite_code),
  UNIQUE(invitee_email, inviter_id)
);

-- Enable RLS
ALTER TABLE public.country_invites ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent invites
CREATE POLICY "Users can view their own invites"
ON public.country_invites
FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can create invites
CREATE POLICY "Users can create invites"
ON public.country_invites
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- Users can update their own invites (for canceling)
CREATE POLICY "Users can update their own invites"
ON public.country_invites
FOR UPDATE
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Users can delete their pending invites
CREATE POLICY "Users can delete pending invites"
ON public.country_invites
FOR DELETE
USING (auth.uid() = inviter_id AND status = 'pending');

-- Function to count completed invite batches for a user
CREATE OR REPLACE FUNCTION public.get_available_invites(user_id UUID)
RETURNS TABLE(existing_country_remaining INT, new_country_remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_completed_batches INT;
  used_existing INT;
  used_new INT;
  max_existing INT;
  max_new INT;
BEGIN
  -- Count how many complete batches of 3 invitees have completed their profiles
  SELECT COALESCE(
    FLOOR(
      (SELECT COUNT(*) FROM country_invites 
       WHERE inviter_id = user_id AND status = 'completed')::DECIMAL / 3
    ), 0
  ) + 1 INTO total_completed_batches; -- +1 for initial batch

  -- Calculate max invites allowed
  max_existing := total_completed_batches;
  max_new := total_completed_batches * 2;

  -- Count used invites (pending or accepted or completed)
  SELECT 
    COUNT(*) FILTER (WHERE is_new_country = false),
    COUNT(*) FILTER (WHERE is_new_country = true)
  INTO used_existing, used_new
  FROM country_invites
  WHERE inviter_id = user_id;

  RETURN QUERY SELECT 
    GREATEST(0, max_existing - used_existing)::INT,
    GREATEST(0, max_new - used_new)::INT;
END;
$$;