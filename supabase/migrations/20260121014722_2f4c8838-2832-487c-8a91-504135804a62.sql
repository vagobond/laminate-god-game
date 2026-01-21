
-- Create user_invites table for tracking invite codes
CREATE TABLE public.user_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitee_email TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'accepted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create table to track if user has seen the invite notification
CREATE TABLE public.invite_notification_seen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_notification_seen ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invites
CREATE POLICY "Users can view their own invites"
  ON public.user_invites FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create their own invites"
  ON public.user_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update their own invites"
  ON public.user_invites FOR UPDATE
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can delete their own available invites"
  ON public.user_invites FOR DELETE
  USING (auth.uid() = inviter_id AND status = 'available');

-- Anyone can check if an invite code is valid (for sign up)
CREATE POLICY "Anyone can check invite codes"
  ON public.user_invites FOR SELECT
  USING (status = 'pending');

-- RLS policies for waitlist (public insert, admin view)
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update waitlist"
  ON public.waitlist FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from waitlist"
  ON public.waitlist FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for invite_notification_seen
CREATE POLICY "Users can view their own notification status"
  ON public.invite_notification_seen FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark notification as seen"
  ON public.invite_notification_seen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate available invite slots for a user
CREATE OR REPLACE FUNCTION public.get_user_invite_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count INTEGER;
  total_slots INTEGER;
  used_slots INTEGER;
  available_slots INTEGER;
BEGIN
  -- Count accepted invites
  SELECT COUNT(*) INTO accepted_count
  FROM user_invites
  WHERE inviter_id = p_user_id AND status = 'accepted';
  
  -- Calculate total slots based on doubling progression
  -- Start with 1, then 2, then 4, etc. based on accepted invites
  -- After 31 total accepted, unlimited (we'll use 9999)
  IF accepted_count >= 31 THEN
    total_slots := 9999; -- unlimited
  ELSIF accepted_count >= 15 THEN
    total_slots := 31;
  ELSIF accepted_count >= 7 THEN
    total_slots := 15;
  ELSIF accepted_count >= 3 THEN
    total_slots := 7;
  ELSIF accepted_count >= 1 THEN
    total_slots := 3;
  ELSE
    total_slots := 1;
  END IF;
  
  -- Count used slots (pending + accepted)
  SELECT COUNT(*) INTO used_slots
  FROM user_invites
  WHERE inviter_id = p_user_id AND status IN ('pending', 'accepted');
  
  available_slots := GREATEST(0, total_slots - used_slots);
  
  RETURN json_build_object(
    'accepted_count', accepted_count,
    'total_slots', total_slots,
    'used_slots', used_slots,
    'available_slots', available_slots,
    'is_unlimited', accepted_count >= 31
  );
END;
$$;

-- Function to validate and use an invite code during signup
CREATE OR REPLACE FUNCTION public.use_invite_code(p_invite_code UUID, p_user_id UUID, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find the pending invite
  SELECT * INTO invite_record
  FROM user_invites
  WHERE invite_code = p_invite_code AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update the invite to accepted
  UPDATE user_invites
  SET status = 'accepted',
      invitee_id = p_user_id,
      accepted_at = now()
  WHERE id = invite_record.id;
  
  RETURN TRUE;
END;
$$;

-- Function to check if invite code is valid
CREATE OR REPLACE FUNCTION public.check_invite_code(p_invite_code UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_invites
    WHERE invite_code = p_invite_code AND status = 'pending'
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_user_invites_inviter ON public.user_invites(inviter_id);
CREATE INDEX idx_user_invites_code ON public.user_invites(invite_code);
CREATE INDEX idx_user_invites_status ON public.user_invites(status);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
