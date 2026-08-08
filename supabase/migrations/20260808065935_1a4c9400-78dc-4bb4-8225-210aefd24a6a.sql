CREATE OR REPLACE FUNCTION public.backup_export_auth_password_hashes()
RETURNS TABLE(id uuid, encrypted_password text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.encrypted_password
  FROM auth.users u
  WHERE u.encrypted_password IS NOT NULL
    AND u.encrypted_password <> '';
$$;

REVOKE ALL ON FUNCTION public.backup_export_auth_password_hashes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backup_export_auth_password_hashes() FROM anon;
REVOKE ALL ON FUNCTION public.backup_export_auth_password_hashes() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.backup_export_auth_password_hashes() TO service_role;