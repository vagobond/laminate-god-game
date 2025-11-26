-- Add user_id to layers table
ALTER TABLE public.layers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update layers RLS policies
DROP POLICY IF EXISTS "Anyone can create layers" ON public.layers;
DROP POLICY IF EXISTS "Anyone can view layers" ON public.layers;

CREATE POLICY "Authenticated users can create layers"
ON public.layers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view layers"
ON public.layers FOR SELECT
USING (true);

CREATE POLICY "Users can update their own layers"
ON public.layers FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Update relationships RLS
DROP POLICY IF EXISTS "Anyone can create relationships" ON public.layer_relationships;

CREATE POLICY "Authenticated users can create relationships"
ON public.layer_relationships FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_layer_updated_at();