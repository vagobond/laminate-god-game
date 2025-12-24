-- Create table for custom friendship type definition
CREATE TABLE public.custom_friendship_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  -- Visibility settings for each field
  show_linkedin boolean NOT NULL DEFAULT false,
  show_contact_email boolean NOT NULL DEFAULT false,
  show_instagram boolean NOT NULL DEFAULT false,
  show_whatsapp boolean NOT NULL DEFAULT false,
  show_phone boolean NOT NULL DEFAULT false,
  show_private_email boolean NOT NULL DEFAULT false,
  show_hometown_coords boolean NOT NULL DEFAULT false,
  show_birthday_day_month boolean NOT NULL DEFAULT false,
  show_birthday_year boolean NOT NULL DEFAULT false,
  show_home_address boolean NOT NULL DEFAULT false,
  show_mailing_address boolean NOT NULL DEFAULT false,
  show_nicknames boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_friendship_types ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own custom type"
ON public.custom_friendship_types FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom type"
ON public.custom_friendship_types FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom type"
ON public.custom_friendship_types FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom type"
ON public.custom_friendship_types FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_friendship_types_updated_at
BEFORE UPDATE ON public.custom_friendship_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add custom_type column to friendships to mark friends assigned to custom type
ALTER TABLE public.friendships 
ADD COLUMN uses_custom_type boolean NOT NULL DEFAULT false;