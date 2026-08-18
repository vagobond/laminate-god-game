# Xcrol Backup Architecture (Tier 1 — Cold Backup)

## Goal
If Lovable, Supabase, or the current operator disappears, a competent stranger
holding the backup bundle + the GitHub mirror can revive Xcrol on a fresh
stack within a day, losing at most ~24 hours of data.

## What gets backed up
| Item                 | Source                          | Format                | Frequency |
| -------------------- | ------------------------------- | --------------------- | --------- |
| Public table data    | Supabase Postgres (service role) | `.ndjson.gz` per table | Daily    |
| Auth users (+hashes) | `auth.admin.listUsers`          | `.ndjson.gz`          | Daily     |
| Storage object catalog | Supabase Storage list API     | `catalog.json.gz`     | Daily     |
| Schema (DDL)         | `supabase/migrations/`          | Git (GitHub mirror)   | On commit |
| Edge function source | `supabase/functions/`           | Git (GitHub mirror)   | On commit |
| Frontend source      | `src/`                          | Git (GitHub mirror)   | On commit |
| Secret-name inventory| edge function env scan          | inside manifest       | Daily     |

Storage object *bytes* are **not** copied in Tier 1 — only the catalog. Most
storage content (avatars, OG images) is regeneratable. To upgrade to full
object copy, see "Tier 1.5" below.

## Where backups live
Primary: **Backblaze B2** bucket `xcrol-backups`, owned by the operator's
personal B2 account (not Lovable, not Supabase). Layout:

```
xcrol/YYYY-MM-DD/<run-timestamp>/
  manifest.json.gz
  db/<table>.ndjson.gz
  auth/users.ndjson.gz
  storage/catalog.json.gz
```

Secondary (recommended): the repo itself is mirrored to a private GitHub repo
via Lovable's GitHub sync. Schema, RLS policies, functions, triggers, and all
app code live there.

## How backups run
A scheduled Supabase Edge Function `nightly-backup`:
1. Authorizes against B2 (`b2_authorize_account`).
2. Pages every public table at 1000 rows/page, gzips NDJSON, uploads.
3. Pages `auth.users` (with `encrypted_password`), gzips, uploads.
4. Walks every storage bucket, writes a catalog (name + size + mtime), uploads.
5. Writes a manifest with row counts, byte sizes, errors, and the names of
   secrets that were set at run time (values are never recorded).
6. Records the run in `public.backup_runs`.
7. Optionally POSTs a one-line status to `BACKUP_ALERT_WEBHOOK`.

## Scheduling

> **CRITICAL — pg_net defaults to a 5 second timeout.**
> An edge function that is cold-starting will *always* exceed 5 seconds, so a
> `net.http_post` without an explicit `timeout_milliseconds` kills the backup
> before it begins. This exact omission silently prevented every nightly backup
> from running for 33 days. Always pass `timeout_milliseconds := 300000`.

Store `CRON_SECRET` in Vault (`vault.create_secret`) rather than inlining it, so
the job body contains no secret material. Run this once using `supabase--insert`
SQL, not a migration — the URL + Vault reference are project-specific and
shouldn't ship to forks:

```sql
select cron.schedule('nightly-backup-0400-utc', '0 4 * * *', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/nightly-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1)
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 300000
  );
$$);

select cron.schedule('heartbeat-check-weekly', '0 5 * * 0', $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/heartbeat-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1)
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 300000
  );
$$);
```

Cron requires the `pg_cron` and `pg_net` extensions to be enabled in the
project.

### Verifying a backup actually ran

> **A `succeeded` row in `cron.job_run_details` proves only that the HTTP call
> was *issued*.** It says nothing about whether the function completed. Two
> checks are the only real proof:

```sql
-- 1. A run row must exist with kind='nightly'
select id, kind, status, files_uploaded, manifest_key, started_at
from public.backup_runs where kind = 'nightly'
order by started_at desc limit 5;

-- 2. The underlying HTTP call must have returned 200, not timed out
select id, status_code, error_msg, created
from net._http_response order by created desc limit 5;
```

A `Timeout of 5000 ms reached` in `net._http_response` means the
`timeout_milliseconds` argument is missing from the cron job body.
Cross-check that the matching `xcrol/YYYY-MM-DD/` prefix exists in B2.

## Retention (apply via B2 Lifecycle Rules)
- `xcrol/` keep all uploads for 14 days
- Move to "hide after 14 days, delete after 90 days" for daily folders
- Pin the 1st of every month folder ("monthlies forever") manually or with a
  separate rule prefix

## Dead-man's switch
`heartbeat-check` runs weekly. When `DEADMAN_ENABLED=1` and `TRUSTEE_EMAIL` is
set, it calls `admin_last_activity()` (service-role-only RPC, migration
`20260818100000`) which returns the most recent of: an `/admin` dashboard load
(`admin_heartbeats`), a fresh sign-in (`auth.users.last_sign_in_at`), a session
token refresh (`auth.sessions.refreshed_at` — i.e. the app was used while
staying signed in), or the latest post by an admin (`xcrol_entries`). If that is
older than `DEADMAN_DAYS` (default 90) it emails the trustee a revival packet
from `noreply@invites.xcrol.com` (the Resend-verified domain — the sender must
stay on a verified domain or Resend rejects the send; the function records
`alert_error` in `backup_runs.notes` if that happens). Any ordinary use of
Xcrol by an admin resets the clock. Off by default.

## Required secrets
| Secret                  | Required | Purpose                          |
| ----------------------- | -------- | -------------------------------- |
| `B2_KEY_ID`             | yes      | Backblaze application key id     |
| `B2_APPLICATION_KEY`    | yes      | Backblaze application key secret |
| `B2_BUCKET_NAME`        | yes      | Target bucket (e.g. `xcrol-backups`) |
| `CRON_SECRET`           | yes      | Shared secret for scheduled invocations |
| `BACKUP_ALERT_WEBHOOK`  | optional | Discord/Slack webhook URL        |
| `RESEND_API_KEY`        | already set | Used by deadman to email trustee |
| `TRUSTEE_EMAIL`         | optional | Recipient for deadman alerts     |
| `DEADMAN_ENABLED`       | optional | Set to `1` to arm the switch     |
| `DEADMAN_DAYS`          | optional | Days of silence before alerting (default 90) |

## Tier 1.5 (later, when wanted)
Add a second function `nightly-storage-sync` that performs incremental copy of
storage object **bytes** to B2 under `storage/<bucket>/<path>`, skipping any
object whose `updated_at` is older than the last successful sync.

## Tier 2 (later)
Move frontend hosting off Lovable (Cloudflare Pages / Vercel), self-host
Supabase on Hetzner, replace AI Gateway with BYOK (already implemented for
Scrolls). See `RUNBOOK.md`.
