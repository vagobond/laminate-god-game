-- Backup fix: expose auth password hashes to the backup edge function ONLY.
--
-- The 2026-08-06 dry-run revival (docs/DRYRUN-2026-08-06.md) proved that the
-- nightly backup's auth dump contains NO password hashes: the admin listUsers
-- API never returns encrypted_password. Without hashes, a revival forces every
-- email/password user through a password reset.
--
-- This SECURITY DEFINER function reads auth.users.encrypted_password directly.
-- EXECUTE is revoked from anon/authenticated/PUBLIC and granted only to
-- service_role, so only edge functions (the nightly-backup function) can call
-- it. Client roles cannot invoke it via PostgREST.

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
