-- Allow admins to view all invites so the admin dashboard can show full invite chains
CREATE POLICY "Admins can view all invites"
  ON public.user_invites FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));