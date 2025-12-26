-- Create xcrol_entries table for daily diary updates
CREATE TABLE public.xcrol_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  link TEXT,
  privacy_level TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT content_length CHECK (char_length(content) <= 240),
  CONSTRAINT one_entry_per_day UNIQUE (user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.xcrol_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own entries
CREATE POLICY "Users can view their own entries"
ON public.xcrol_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own entries
CREATE POLICY "Users can insert their own entries"
ON public.xcrol_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries (same day only)
CREATE POLICY "Users can update their own entries"
ON public.xcrol_entries
FOR UPDATE
USING (auth.uid() = user_id AND entry_date = CURRENT_DATE);

-- Users can delete their own entries
CREATE POLICY "Users can delete their own entries"
ON public.xcrol_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Friends can view entries based on privacy level
CREATE POLICY "Friends can view entries based on privacy"
ON public.xcrol_entries
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != user_id
  AND privacy_level != 'private'
  AND NOT is_blocked(user_id, auth.uid())
  AND NOT is_blocked(auth.uid(), user_id)
  AND EXISTS (
    SELECT 1 FROM friendships f
    WHERE f.user_id = xcrol_entries.user_id
    AND f.friend_id = auth.uid()
    AND (
      (privacy_level = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
      OR (privacy_level = 'buddy' AND f.level IN ('close_friend', 'buddy', 'secret_friend'))
      OR (privacy_level = 'friendly_acquaintance' AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend'))
    )
  )
);