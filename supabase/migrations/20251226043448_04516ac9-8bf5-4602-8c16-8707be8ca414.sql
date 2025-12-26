-- Add can_leave_reference column to custom_friendship_types
ALTER TABLE public.custom_friendship_types 
ADD COLUMN can_leave_reference boolean NOT NULL DEFAULT false;