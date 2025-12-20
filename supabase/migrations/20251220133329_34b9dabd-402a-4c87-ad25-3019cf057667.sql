-- Create table for dynamic social links
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  friendship_level_required TEXT NOT NULL DEFAULT 'friendly_acquaintance',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own social links
CREATE POLICY "Users can view their own social links"
ON public.social_links
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own social links
CREATE POLICY "Users can insert their own social links"
ON public.social_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own social links
CREATE POLICY "Users can update their own social links"
ON public.social_links
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own social links
CREATE POLICY "Users can delete their own social links"
ON public.social_links
FOR DELETE
USING (auth.uid() = user_id);

-- Friends can view social links based on friendship level
CREATE POLICY "Friends can view social links based on level"
ON public.social_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.friend_id = auth.uid() 
    AND f.user_id = social_links.user_id
    AND (
      (social_links.friendship_level_required = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
      OR (social_links.friendship_level_required = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend'))
      OR (social_links.friendship_level_required = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend'))
    )
  )
);