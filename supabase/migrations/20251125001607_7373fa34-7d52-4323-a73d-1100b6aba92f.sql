-- Create layers table to store all created layers
CREATE TABLE public.layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  domain TEXT,
  philosophy TEXT,
  vision TEXT,
  description TEXT,
  branches_count INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create layer_relationships table to track parent-child relationships
CREATE TABLE public.layer_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_layer_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  child_layer_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_layer_id, child_layer_id)
);

-- Enable Row Level Security
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anyone can view layers)
CREATE POLICY "Anyone can view layers"
ON public.layers
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view relationships"
ON public.layer_relationships
FOR SELECT
USING (true);

-- Create policies for public write access (anyone can create layers for now)
CREATE POLICY "Anyone can create layers"
ON public.layers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can create relationships"
ON public.layer_relationships
FOR INSERT
WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_layer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_layers_updated_at
BEFORE UPDATE ON public.layers
FOR EACH ROW
EXECUTE FUNCTION public.update_layer_updated_at();

-- Function to recursively calculate descendant points for a layer
CREATE OR REPLACE FUNCTION public.calculate_layer_points(layer_id UUID)
RETURNS INTEGER AS $$
DECLARE
  direct_branches INTEGER;
  descendant_points INTEGER := 0;
  child_record RECORD;
BEGIN
  -- Count direct branches
  SELECT COUNT(*) INTO direct_branches
  FROM public.layer_relationships
  WHERE parent_layer_id = layer_id;
  
  -- Calculate points from descendants recursively
  FOR child_record IN 
    SELECT child_layer_id 
    FROM public.layer_relationships 
    WHERE parent_layer_id = layer_id
  LOOP
    descendant_points := descendant_points + public.calculate_layer_points(child_record.child_layer_id);
  END LOOP;
  
  -- Each direct branch gives 100 points, plus all descendant points
  RETURN (direct_branches * 100) + descendant_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update all layer points and branch counts
CREATE OR REPLACE FUNCTION public.refresh_layer_stats()
RETURNS void AS $$
DECLARE
  layer_record RECORD;
  branch_count INTEGER;
  calculated_points INTEGER;
BEGIN
  FOR layer_record IN SELECT id FROM public.layers
  LOOP
    -- Update branches count
    SELECT COUNT(*) INTO branch_count
    FROM public.layer_relationships
    WHERE parent_layer_id = layer_record.id;
    
    -- Calculate total points
    calculated_points := public.calculate_layer_points(layer_record.id);
    
    -- Update the layer
    UPDATE public.layers
    SET branches_count = branch_count,
        total_points = calculated_points
    WHERE id = layer_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to refresh stats when relationships change
CREATE OR REPLACE FUNCTION public.refresh_stats_on_relationship_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.refresh_layer_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER refresh_stats_after_relationship_insert
AFTER INSERT ON public.layer_relationships
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_stats_on_relationship_change();

-- Insert the Verse Layer as the first root node
INSERT INTO public.layers (name, creator_name, domain, description, branches_count, total_points)
VALUES (
  'The Verse Layer',
  'Pader Familias',
  'The Four Continents',
  'A primordial world of four continents shaped by Genesis Elders. Explore Aethermoor''s crystal plains, Pyrothane''s volcanic canyons, Verdania''s singing forests, and Mistmere''s floating islands.',
  0,
  0
);