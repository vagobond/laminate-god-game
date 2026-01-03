-- Create account deletion requests table
CREATE TABLE public.account_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own deletion request
CREATE POLICY "Users can create their own deletion request"
ON public.account_deletion_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
ON public.account_deletion_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can cancel their own pending deletion requests
CREATE POLICY "Users can cancel their own pending requests"
ON public.account_deletion_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.account_deletion_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update any deletion request
CREATE POLICY "Admins can update any deletion request"
ON public.account_deletion_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));