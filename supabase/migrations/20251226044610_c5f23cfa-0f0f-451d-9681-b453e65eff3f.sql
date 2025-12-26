-- Create flagged_references table
CREATE TABLE public.flagged_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.user_references(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  UNIQUE(reference_id, flagged_by)
);

-- Enable RLS
ALTER TABLE public.flagged_references ENABLE ROW LEVEL SECURITY;

-- Users can flag references on their own profiles
CREATE POLICY "Users can flag references on their profile"
ON public.flagged_references
FOR INSERT
WITH CHECK (
  auth.uid() = flagged_by AND
  EXISTS (
    SELECT 1 FROM public.user_references 
    WHERE id = reference_id AND to_user_id = auth.uid()
  )
);

-- Users can view their own flags
CREATE POLICY "Users can view their own flags"
ON public.flagged_references
FOR SELECT
USING (auth.uid() = flagged_by);

-- Admins can view all flagged references
CREATE POLICY "Admins can view all flagged references"
ON public.flagged_references
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update flagged references
CREATE POLICY "Admins can update flagged references"
ON public.flagged_references
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete references
CREATE POLICY "Admins can delete any reference"
ON public.user_references
FOR DELETE
USING (has_role(auth.uid(), 'admin'));