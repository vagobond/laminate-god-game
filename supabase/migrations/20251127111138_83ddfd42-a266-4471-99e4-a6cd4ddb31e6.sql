-- Add GitHub repository URL to layers table
ALTER TABLE public.layers 
ADD COLUMN github_repo_url text;

-- Add a comment explaining the column
COMMENT ON COLUMN public.layers.github_repo_url IS 'GitHub repository URL where the player builds their layer in Lovable';
