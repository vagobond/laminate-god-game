-- Add compensation_type_preferred column to hosting_preferences
ALTER TABLE public.hosting_preferences 
ADD COLUMN IF NOT EXISTS compensation_type_preferred TEXT DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.hosting_preferences.compensation_type_preferred IS 'Preferred compensation type: none, monetary, food, hangout_time, friendship, fwb';