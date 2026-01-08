-- Create a user_settings table to persist privacy and notification preferences
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification preferences
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  friend_request_notifications BOOLEAN NOT NULL DEFAULT true,
  
  -- Privacy preferences
  show_online_status BOOLEAN NOT NULL DEFAULT true,
  allow_friend_requests BOOLEAN NOT NULL DEFAULT true,
  
  -- Data sharing preferences for OAuth
  default_share_email BOOLEAN NOT NULL DEFAULT false,
  default_share_hometown BOOLEAN NOT NULL DEFAULT false,
  default_share_connections BOOLEAN NOT NULL DEFAULT false,
  default_share_xcrol BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view and modify their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();