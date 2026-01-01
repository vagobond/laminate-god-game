-- Create table for xcrol entry reactions
CREATE TABLE public.xcrol_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.xcrol_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id, emoji)
);

-- Enable Row Level Security
ALTER TABLE public.xcrol_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on entries they can see
CREATE POLICY "Users can view reactions on visible entries"
ON public.xcrol_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.id = entry_id
    AND (
      e.privacy_level = 'public'
      OR e.user_id = auth.uid()
      OR (
        auth.uid() IS NOT NULL
        AND NOT is_blocked(e.user_id, auth.uid())
        AND NOT is_blocked(auth.uid(), e.user_id)
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = e.user_id
          AND f.friend_id = auth.uid()
          AND (
            (e.privacy_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
            OR (e.privacy_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend'))
            OR (e.privacy_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend'))
          )
        )
      )
    )
  )
);

-- Users can add reactions to entries they can see
CREATE POLICY "Users can add reactions to visible entries"
ON public.xcrol_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.id = entry_id
    AND (
      e.privacy_level = 'public'
      OR e.user_id = auth.uid()
      OR (
        NOT is_blocked(e.user_id, auth.uid())
        AND NOT is_blocked(auth.uid(), e.user_id)
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = e.user_id
          AND f.friend_id = auth.uid()
          AND (
            (e.privacy_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
            OR (e.privacy_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend'))
            OR (e.privacy_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend'))
          )
        )
      )
    )
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.xcrol_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_xcrol_reactions_entry_id ON public.xcrol_reactions(entry_id);