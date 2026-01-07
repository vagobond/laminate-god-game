-- Create meetups/events table
CREATE TABLE public.meetups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  is_open_ended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Anyone can view meetups
CREATE POLICY "Anyone can view meetups" 
ON public.meetups 
FOR SELECT 
USING (true);

-- Authenticated users can create meetups
CREATE POLICY "Authenticated users can create meetups" 
ON public.meetups 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Users can update their own meetups
CREATE POLICY "Users can update their own meetups" 
ON public.meetups 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Users can delete their own meetups
CREATE POLICY "Users can delete their own meetups" 
ON public.meetups 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meetups_updated_at
BEFORE UPDATE ON public.meetups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();