-- Create friendship level enum
CREATE TYPE public.friendship_level AS ENUM ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend');

-- Friend requests table
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Friendships table (stores accepted friendships)
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level friendship_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Add new profile fields for different visibility levels
ALTER TABLE public.profiles
ADD COLUMN whatsapp TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN private_email TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN linkedin_url TEXT,
ADD COLUMN contact_email TEXT;

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can view requests they sent or received"
ON public.friend_requests FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete requests they sent or received"
ON public.friend_requests FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view friendships where they are the friend"
ON public.friendships FOR SELECT
USING (auth.uid() = friend_id);

CREATE POLICY "Users can create friendships for themselves"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
ON public.friendships FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id);

-- Function to get friendship level between two users
CREATE OR REPLACE FUNCTION public.get_friendship_level(viewer_id UUID, profile_id UUID)
RETURNS friendship_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT level FROM public.friendships
  WHERE user_id = profile_id AND friend_id = viewer_id
  LIMIT 1;
$$;

-- Function to check if users are mutual close friends (for seeing levels)
CREATE OR REPLACE FUNCTION public.are_mutual_close_friends(user1_id UUID, user2_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships f1
    JOIN public.friendships f2 ON f1.user_id = f2.friend_id AND f1.friend_id = f2.user_id
    WHERE f1.user_id = user1_id AND f1.friend_id = user2_id
    AND f1.level IN ('close_friend', 'secret_friend')
    AND f2.level IN ('close_friend', 'secret_friend')
  );
$$;