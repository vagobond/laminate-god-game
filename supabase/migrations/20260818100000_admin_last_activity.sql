-- Dead-man's switch: a single server-side "when was an admin last alive"
-- signal, so the switch reflects real use of Xcrol rather than only visits
-- to the /admin dashboard (the 2026-08-14 heartbeat table) or fresh sign-ins.
--
-- Signals combined (greatest of):
--   * admin_heartbeats.last_seen_at      — /admin dashboard load
--   * auth.users.last_sign_in_at         — fresh sign-in
--   * auth.sessions.refreshed_at         — token refresh = the app was used
--                                          while staying signed in
--   * xcrol_entries.created_at           — the admin posted
--
-- Callable ONLY by service_role (heartbeat-check edge fn). Not exposed to
-- anon/authenticated: it reads auth.sessions.

CREATE OR REPLACE FUNCTION public.admin_last_activity()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH admins AS (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
  SELECT greatest(
    (SELECT max(h.last_seen_at) FROM public.admin_heartbeats h JOIN admins a ON a.user_id = h.user_id),
    (SELECT max(u.last_sign_in_at) FROM auth.users u JOIN admins a ON a.user_id = u.id),
    (SELECT max(s.refreshed_at AT TIME ZONE 'UTC') FROM auth.sessions s JOIN admins a ON a.user_id = s.user_id), -- refreshed_at is timestamp (naive, UTC)
    (SELECT max(e.created_at) FROM public.xcrol_entries e JOIN admins a ON a.user_id = e.user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_last_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_last_activity() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_last_activity() TO service_role;
