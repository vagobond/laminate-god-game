-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create request_type enum for meetup requests
CREATE TYPE public.meetup_purpose AS ENUM ('tourism', 'food', 'friendship', 'romance');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
CREATE TYPE public.reference_type AS ENUM ('host', 'guest', 'friendly', 'business');

-- Meetup preferences table - users opt-in to being open to meetups
CREATE TABLE public.meetup_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_open_to_meetups BOOLEAN NOT NULL DEFAULT false,
  meetup_description TEXT,
  min_friendship_level TEXT NOT NULL DEFAULT 'buddy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Hosting preferences table - users opt-in to hosting
CREATE TABLE public.hosting_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_open_to_hosting BOOLEAN NOT NULL DEFAULT false,
  hosting_description TEXT,
  accommodation_type TEXT,
  max_guests INTEGER DEFAULT 1,
  min_friendship_level TEXT NOT NULL DEFAULT 'buddy',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Meetup requests table
CREATE TABLE public.meetup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose meetup_purpose NOT NULL,
  message TEXT NOT NULL,
  proposed_dates TEXT,
  status request_status NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hosting requests table
CREATE TABLE public.hosting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  arrival_date DATE,
  departure_date DATE,
  num_guests INTEGER DEFAULT 1,
  status request_status NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- References table - publicly visible
CREATE TABLE public.user_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference_type reference_type NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, reference_type)
);

-- Enable RLS on all tables
ALTER TABLE public.meetup_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_references ENABLE ROW LEVEL SECURITY;

-- Meetup preferences policies
CREATE POLICY "Users can view their own meetup preferences"
ON public.meetup_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetup preferences"
ON public.meetup_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetup preferences"
ON public.meetup_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetup preferences"
ON public.meetup_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Friends can view meetup preferences based on level"
ON public.meetup_preferences FOR SELECT
USING (
  is_open_to_meetups = true AND
  NOT is_blocked(user_id, auth.uid()) AND
  NOT is_blocked(auth.uid(), user_id) AND
  EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.friend_id = auth.uid() AND f.user_id = meetup_preferences.user_id
    AND (
      (meetup_preferences.min_friendship_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
      (meetup_preferences.min_friendship_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend')) OR
      (meetup_preferences.min_friendship_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
    )
  )
);

-- Hosting preferences policies
CREATE POLICY "Users can view their own hosting preferences"
ON public.hosting_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hosting preferences"
ON public.hosting_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hosting preferences"
ON public.hosting_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hosting preferences"
ON public.hosting_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Friends can view hosting preferences based on level"
ON public.hosting_preferences FOR SELECT
USING (
  is_open_to_hosting = true AND
  NOT is_blocked(user_id, auth.uid()) AND
  NOT is_blocked(auth.uid(), user_id) AND
  EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.friend_id = auth.uid() AND f.user_id = hosting_preferences.user_id
    AND (
      (hosting_preferences.min_friendship_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')) OR
      (hosting_preferences.min_friendship_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend')) OR
      (hosting_preferences.min_friendship_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
    )
  )
);

-- Meetup requests policies
CREATE POLICY "Users can view meetup requests they sent or received"
ON public.meetup_requests FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create meetup requests"
ON public.meetup_requests FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  NOT is_blocked(to_user_id, from_user_id) AND
  NOT is_blocked(from_user_id, to_user_id)
);

CREATE POLICY "Users can update meetup requests they participate in"
ON public.meetup_requests FOR UPDATE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can delete meetup requests they sent"
ON public.meetup_requests FOR DELETE USING (auth.uid() = from_user_id);

-- Hosting requests policies
CREATE POLICY "Users can view hosting requests they sent or received"
ON public.hosting_requests FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create hosting requests"
ON public.hosting_requests FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  NOT is_blocked(to_user_id, from_user_id) AND
  NOT is_blocked(from_user_id, to_user_id)
);

CREATE POLICY "Users can update hosting requests they participate in"
ON public.hosting_requests FOR UPDATE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can delete hosting requests they sent"
ON public.hosting_requests FOR DELETE USING (auth.uid() = from_user_id);

-- References policies - publicly readable
CREATE POLICY "Anyone can view references"
ON public.user_references FOR SELECT USING (true);

CREATE POLICY "Users can create references for friends or after interaction"
ON public.user_references FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  from_user_id != to_user_id AND
  NOT is_blocked(to_user_id, from_user_id) AND
  NOT is_blocked(from_user_id, to_user_id) AND
  (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.user_id = from_user_id AND f.friend_id = to_user_id
      AND f.level IN ('close_friend', 'buddy', 'secret_friend')
    )
    OR
    (
      (reference_type = 'host' OR reference_type = 'guest') AND
      EXISTS (
        SELECT 1 FROM hosting_requests hr
        WHERE hr.status = 'accepted'
        AND ((hr.from_user_id = from_user_id AND hr.to_user_id = to_user_id)
          OR (hr.from_user_id = to_user_id AND hr.to_user_id = from_user_id))
      )
    )
    OR
    (
      reference_type = 'friendly' AND
      EXISTS (
        SELECT 1 FROM meetup_requests mr
        WHERE mr.status = 'accepted'
        AND ((mr.from_user_id = from_user_id AND mr.to_user_id = to_user_id)
          OR (mr.from_user_id = to_user_id AND mr.to_user_id = from_user_id))
      )
    )
  )
);

CREATE POLICY "Users can update their own references"
ON public.user_references FOR UPDATE USING (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own references"
ON public.user_references FOR DELETE USING (auth.uid() = from_user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_meetup_preferences_updated_at
BEFORE UPDATE ON public.meetup_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hosting_preferences_updated_at
BEFORE UPDATE ON public.hosting_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetup_requests_updated_at
BEFORE UPDATE ON public.meetup_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hosting_requests_updated_at
BEFORE UPDATE ON public.hosting_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_references_updated_at
BEFORE UPDATE ON public.user_references
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();