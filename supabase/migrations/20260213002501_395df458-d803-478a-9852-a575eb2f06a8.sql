
-- Table to store which predefined widgets a user has enabled
CREATE TABLE public.profile_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, widget_key)
);

-- Enable RLS
ALTER TABLE public.profile_widgets ENABLE ROW LEVEL SECURITY;

-- Users can view anyone's enabled widgets (needed for public profiles)
CREATE POLICY "Anyone can view enabled widgets"
  ON public.profile_widgets
  FOR SELECT
  USING (enabled = true);

-- Users can manage their own widgets
CREATE POLICY "Users can insert their own widgets"
  ON public.profile_widgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widgets"
  ON public.profile_widgets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widgets"
  ON public.profile_widgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_profile_widgets_updated_at
  BEFORE UPDATE ON public.profile_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
