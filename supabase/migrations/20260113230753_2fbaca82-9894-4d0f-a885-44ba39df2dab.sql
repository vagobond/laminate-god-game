-- Create brooks table for two-person private streams
CREATE TABLE public.brooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  custom_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, rested, archived
  inactivity_days INTEGER NOT NULL DEFAULT 7, -- 3, 7, or 9 days
  last_post_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invite_email TEXT, -- for email invites
  CONSTRAINT brooks_different_users CHECK (user1_id != user2_id)
);

-- Create brook posts table
CREATE TABLE public.brook_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brook_id UUID NOT NULL REFERENCES public.brooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT brook_posts_content_length CHECK (char_length(content) <= 240)
);

-- Create brook reactions table
CREATE TABLE public.brook_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.brook_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create brook comments table
CREATE TABLE public.brook_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.brook_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT brook_comments_content_length CHECK (char_length(content) <= 500)
);

-- Create indexes
CREATE INDEX idx_brooks_user1 ON public.brooks(user1_id);
CREATE INDEX idx_brooks_user2 ON public.brooks(user2_id);
CREATE INDEX idx_brooks_status ON public.brooks(status);
CREATE INDEX idx_brook_posts_brook ON public.brook_posts(brook_id);
CREATE INDEX idx_brook_posts_user ON public.brook_posts(user_id);
CREATE INDEX idx_brook_reactions_post ON public.brook_reactions(post_id);
CREATE INDEX idx_brook_comments_post ON public.brook_comments(post_id);

-- Enable RLS
ALTER TABLE public.brooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brook_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brook_comments ENABLE ROW LEVEL SECURITY;

-- Brooks policies - only participants can see/modify their brooks
CREATE POLICY "Users can view their own brooks"
ON public.brooks FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create brooks"
ON public.brooks FOR INSERT
WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Participants can update their brooks"
ON public.brooks FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Brook posts policies
CREATE POLICY "Participants can view brook posts"
ON public.brook_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brooks b
    WHERE b.id = brook_id
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Participants can create brook posts"
ON public.brook_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.brooks b
    WHERE b.id = brook_id
    AND b.status = 'active'
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own brook posts"
ON public.brook_posts FOR DELETE
USING (auth.uid() = user_id);

-- Brook reactions policies
CREATE POLICY "Participants can view brook reactions"
ON public.brook_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brook_posts bp
    JOIN public.brooks b ON b.id = bp.brook_id
    WHERE bp.id = post_id
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Participants can add brook reactions"
ON public.brook_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.brook_posts bp
    JOIN public.brooks b ON b.id = bp.brook_id
    WHERE bp.id = post_id
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own brook reactions"
ON public.brook_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Brook comments policies
CREATE POLICY "Participants can view brook comments"
ON public.brook_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.brook_posts bp
    JOIN public.brooks b ON b.id = bp.brook_id
    WHERE bp.id = post_id
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Participants can add brook comments"
ON public.brook_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.brook_posts bp
    JOIN public.brooks b ON b.id = bp.brook_id
    WHERE bp.id = post_id
    AND (b.user1_id = auth.uid() OR b.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own brook comments"
ON public.brook_comments FOR DELETE
USING (auth.uid() = user_id);

-- Function to check if user can create new brook (max 5 active)
CREATE OR REPLACE FUNCTION public.can_create_brook(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) < 5
  FROM public.brooks
  WHERE (user1_id = p_user_id OR user2_id = p_user_id)
  AND status IN ('pending', 'active');
$$;

-- Function to check if user already has a brook with another user
CREATE OR REPLACE FUNCTION public.has_brook_with(p_user_id UUID, p_other_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brooks
    WHERE status IN ('pending', 'active')
    AND (
      (user1_id = p_user_id AND user2_id = p_other_id) OR
      (user1_id = p_other_id AND user2_id = p_user_id)
    )
  );
$$;

-- Function to check if user can post today in a brook
CREATE OR REPLACE FUNCTION public.can_post_in_brook(p_brook_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.brook_posts
    WHERE brook_id = p_brook_id
    AND user_id = p_user_id
    AND created_at::date = CURRENT_DATE
  );
$$;

-- Trigger to update brook's last_post_at
CREATE OR REPLACE FUNCTION public.update_brook_last_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.brooks
  SET last_post_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.brook_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER brook_post_update_last_post
AFTER INSERT ON public.brook_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_brook_last_post();

-- Trigger to update brooks updated_at
CREATE TRIGGER update_brooks_updated_at
BEFORE UPDATE ON public.brooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();