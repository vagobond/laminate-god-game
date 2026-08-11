# Xcrol Operations & Revival Runbook

Last verified against live infrastructure: **2026-08-10** (post-cutover).

Xcrol runs 100% on owner-controlled infrastructure. There is no Lovable
dependency anywhere. This document covers (A) how the system runs today,
(B) routine operations, and (C) full disaster revival from backups if the
original operator is unavailable.

If you are a successor reading this cold: start at **Section 0**, then jump
to **Section 4 (Revival)**. You will need the credentials escrow
(`docs/ESCROW.md` describes it — an offline KeePassXC vault), a credit card,
and ~3 hours.

---

## 0. Current architecture (as of 2026-08-10)

| Piece | What / where |
| ----- | ------------ |
| Backend | Managed Supabase project **`wmatvlxehyaufhjljtby`** (region `ap-southeast-2`), owner's own account. Free tier — DB ~23 MB / storage ~52 MB vs 500 MB / 1 GB limits. |
| Frontend | Static Vite build served by a **Cloudflare Worker** (assets-only, see `wrangler.jsonc`) with custom domains `xcrol.com` + `www.xcrol.com`. Escape-pod URL: `xcrol.baldjesusnft.workers.dev` (same bundle, also on the Supabase auth redirect allowlist). |
| DNS | `xcrol.com` **zone hosted on Cloudflare** (nameservers `sloan` + `piers` .ns.cloudflare.com). WordPress.com is registrar only. |
| Auth email (SMTP) | Supabase custom SMTP → owner's Resend account (values in §6). Already configured on the live project. |
| Google OAuth | Owner's own Google Cloud client (project `xcrol`, client `xcrol-web`). Credentials in escrow. No third-party-managed OAuth anywhere. |
| Backups | Nightly pg_cron → `nightly-backup` edge function → Backblaze B2 bucket `xcrol-backups`, **including auth password hashes** (see §3). |
| CI/CD | GitHub repo `vagobond/xcrol` (private). Frontend auto-deploys via Cloudflare Workers Builds on merge to main; backend via `.github/workflows/backend-deploy.yml`; RLS tests via `.github/workflows/rls-tests.yml`; uptime via `.github/workflows/uptime.yml`; weekly restore verification via `.github/workflows/restore-verify.yml`. |

Free-tier caveat: Supabase pauses free projects after ~1 week of zero
activity. Live daily traffic plus the nightly backup cron prevents this. If
the project ever pauses anyway, restore it from the Supabase dashboard and
verify the crons resumed (§8 verification queries).

---

## 1. Routine operations (day 2)

The workflow is AI-agnostic — the codebase is standard open tech
(Vite/React, Supabase, SQL migrations, Deno edge functions). Any agentic
coding tool can maintain it:

1. Make the change on a branch, open a PR.
2. CI runs the RLS test suite on any `supabase/**` change
   (`rls-tests.yml` — replays all migrations from zero and asserts the
   visibility/privacy policies).
3. Merge to main:
   - **Frontend** deploys automatically (Cloudflare Workers Builds).
     Manual alternative: `npm run deploy` with `CLOUDFLARE_API_TOKEN` set.
   - **Backend** deploys automatically via `backend-deploy.yml` when the
     merge touches `supabase/**` (or manual "Run workflow"): links the CLI,
     runs `db push`, deploys all edge functions. Uses three repo secrets —
     `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`
     — which point at the **production** project. The workflow retries the
     functions deploy 3× because esm.sh occasionally 522s during bundling.

Known deploy flake: if a Workers build fails on a frozen-lockfile error,
regenerate `bun.lock` in the same commit as any dependency change.

---

## 2. Monitoring & alarms

| Check | Mechanism | Cadence |
| ----- | --------- | ------- |
| Site + backend up | `uptime.yml` — curls `https://xcrol.com` (expects 200) and `https://wmatvlxehyaufhjljtby.supabase.co/functions/v1/health` (expects `"status":"healthy"`) | Every 30 min |
| Backup ran & is fresh | `restore-verify.yml` — restores the latest B2 snapshot into a scratch DB and **fails if the newest snapshot is older than 48 h** | Mondays 06:00 UTC |
| Backup heartbeat | `heartbeat-check` edge function via pg_cron | Sundays 05:00 UTC |

GitHub emails the workflow actor on failure. Caveat: GitHub auto-disables
scheduled workflows in repos with no pushes for 60 days — a quiet repo can
silently lose its uptime check. If the repo ever goes dormant, re-enable
schedules under the Actions tab or push a trivial commit.

The `health` edge function (no auth required) checks DB reachability
(200/503) and reports backup freshness informationally in its JSON body.

---

## 3. What the backups contain

Nightly at 04:00 UTC, pg_cron invokes `nightly-backup`, which writes a
snapshot to B2 under `xcrol/YYYY-MM-DD/<timestamp>/`:

- `db/*.ndjson.gz` — every public table's rows (67 tables as of writing).
- `auth/users.ndjson.gz` — all auth users **including `encrypted_password`
  bcrypt hashes**, merged in via the `backup_export_auth_password_hashes()`
  SECURITY DEFINER RPC (service-role-only). Verified live: 83/83 users with
  hashes. **Password resets are NOT needed on revival.**
- `storage/` — an **object catalog, not bytes** (see §4d for bytes).
- `manifest.json.gz` — per-table row counts, secret *names* present,
  storage buckets, and an `errors` array. A good snapshot has `errors: []`.

If a snapshot day ever contains **two** timestamp folders, investigate —
only one writer (`xcrol-backup-writer` B2 key) should exist. A second
writer previously came from a stale external cron and was killed by
deleting its B2 key.

---

## 4. Disaster revival (from B2 + GitHub, ~3 hours)

You need: the B2 credentials + Supabase/Cloudflare/Google/Resend logins from
the escrow vault, or failing that, fresh accounts and a credit card.
Without B2 credentials you can still revive the *application* from GitHub
but you will lose all user data.

### 4.0 Provision a Supabase project

1. Create a new project (free tier fits comfortably).
2. Note the project ref, anon key, service role key, and DB URL.
3. Enable the `pg_cron` and `pg_net` extensions (Database → Extensions).

(Self-hosting Supabase on a VPS also works — the app uses nothing
Supabase-cloud-specific — but managed free tier is the default path.)

### 4a. Restore auth users FIRST

Restore auth users **before** applying migrations. Two reasons: every
table's `user_id` FK references `auth.users`, and one migration hardcodes
the admin user (next section).

Pull the newest good snapshot (a folder whose `manifest.json.gz` has
`errors: []`):

```bash
pip install b2
b2 account authorize <key-id> <application-key>
b2 sync b2://xcrol-backups/xcrol/<YYYY-MM-DD>/<timestamp> ./snapshot
gunzip -r ./snapshot
```

Then create each user via the admin API, **preserving the original `id`
and the bcrypt hash**:

```ts
import { createClient } from "@supabase/supabase-js";
const admin = createClient(URL, SERVICE_ROLE_KEY);
for (const u of usersFromDump) {
  await admin.auth.admin.createUser({
    id: u.id,
    email: u.email,
    email_confirm: !!u.email_confirmed_at,
    password_hash: u.encrypted_password, // bcrypt, present in the dump
    user_metadata: u.user_metadata,
    app_metadata: u.app_metadata,
  });
}
```

Creation failures are **silent** unless you check each response — verify
the created count equals the dump count afterwards. OAuth-only users
(null hash) re-match by email as long as the same Google client is
configured (credentials in escrow).

### 4b. Restore the schema

```bash
git clone <repo-url> xcrol && cd xcrol
npx supabase link --project-ref <new-ref>
npx supabase db push
```

**Known landmine:** migration `20251206020240_*` hardcodes an INSERT into
`user_roles` for admin user id `8b7e8511-ac9e-4e49-a759-7f00ce0de42d`. If
that auth user doesn't exist yet, `db push` dies mid-sequence with an FK
error. Doing §4a first avoids this. If you skipped it, create just that
user (`POST /auth/v1/admin/users`, service role key, body
`{"id": "8b7e8511-ac9e-4e49-a759-7f00ce0de42d", "email": "<admin email>",
"email_confirm": true}`) and re-run `db push` — it resumes from the failed
migration.

### 4c. Restore the data

Don't trust any hardcoded table list — load **whatever `.ndjson.gz` files
the snapshot's `db/` folder actually contains**, using a multi-pass retry
loop: attempt every table, collect FK failures, retry them in another
pass, stop when a pass makes no progress. In practice everything loads in
2 passes.

**Disable triggers while loading**, or the load re-fires them and inflates
`audit_log` and `notifications` with freshly generated rows.
`SET session_replication_role = replica` is **superuser-blocked on managed
Supabase** — use per-table disabling over a direct SQL connection instead:

```sql
ALTER TABLE public.<t> DISABLE TRIGGER USER;
-- load the table
ALTER TABLE public.<t> ENABLE TRIGGER USER;
```

Load method: direct SQL (`jsonb_populate_recordset`) or REST upserts with
`Prefer: resolution=merge-duplicates` in ~500-row batches with the service
key. Notes from verified restores:

- Migrations **seed some rows** (e.g. a default `layers` row), so a few
  tables end up with snapshot rows *plus* seeded rows — harmless small
  count mismatches.
- Verify counts against `manifest.json.gz` (`tables.<name>.rows`).
- `scroll_ai_usage` has no `id` column (composite key) — count it with
  `select=*`, not `select=id`.
- All primary keys are UUIDs; there are no serial sequences to reset.

### 4d. Storage bytes

The B2 snapshot has the object *catalog* only. Both buckets (`avatars`,
`public-snapshots`) are **public**, so if the original project is still
reachable, re-download every object via its public URL using the catalog
paths (object paths are keyed by auth-user UUIDs, which survive restore).
A byte-verified local copy also exists at
`~/Projects/xcrol-storage-backup/` (refresh it before any planned
migration). If neither source exists, storage is lost: users re-upload
avatars, OG images regenerate automatically.

## 5. Re-create edge function secrets

Set via `npx supabase secrets set` (or dashboard). The manifest lists the
secret names present at backup time:

| Secret | Where to get a value |
| ------ | -------------------- |
| `B2_KEY_ID` / `B2_APPLICATION_KEY` | B2 app key with write access to `xcrol-backups` (mint fresh; name it `xcrol-backup-writer`) |
| `B2_BUCKET_NAME` | `xcrol-backups` |
| `CRON_SECRET` | Generate a fresh random string — must ALSO be stored in Vault (§8) |
| `RESEND_API_KEY` | resend.com → API keys |
| `MAPBOX_PUBLIC_TOKEN` | mapbox.com → tokens |
| `APP_PUBLIC_URL` | `https://xcrol.com` |

Also confirm `nightly-backup` and `heartbeat-check` have `verify_jwt =
false` in `supabase/config.toml` (they do in the repo) — otherwise the
cron's HTTP calls 401.

## 6. Auth email (SMTP) — REQUIRED on a new project

Without it, password resets and signup confirmations silently fail.
Supabase dashboard → **Authentication → Emails → SMTP settings** → enable
**Custom SMTP**:

| Field | Value |
| ----- | ----- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literally) |
| Password | a Resend API key (a dedicated key named `xcrol-auth-smtp` may already exist) |
| Sender email | `noreply@invites.xcrol.com` (domain verified in Resend) |
| Sender name | `Xcrol` |

Then send yourself a password reset and confirm the From address. (Already
configured on the live project — this section is for revival into a new
project.)

## 7. Frontend + DNS

**Frontend:** the repo deploys as a Cloudflare Worker (`wrangler.jsonc`,
assets-only). Either connect the repo to Cloudflare Workers Builds, or run
`npm run deploy` locally with a `CLOUDFLARE_API_TOKEN`. Set
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID` (in `.env` at build time) to the new project.
Any static host (Pages, Vercel) also works with build `npm run build`,
output `dist/`.

**DNS:** the `xcrol.com` zone lives on Cloudflare; WordPress.com is
registrar only. Attach the Worker's custom domains (`xcrol.com`, `www`) in
the Cloudflare dashboard — if it errors that a DNS record already exists
(error 100117), delete the conflicting A/CNAME first.

**These three Resend records must survive any zone move** (they were
dropped once in a zone import and had to be re-added by hand):

| Type | Name | Value |
| ---- | ---- | ----- |
| TXT | `send.invites` | `v=spf1 include:amazonses.com ~all` |
| MX | `send.invites` | `10 feedback-smtp.ap-northeast-1.amazonses.com` |
| TXT | `resend._domainkey.invites` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDU41zLROULtL/QfPrz3rjGjCoK6RzFe9UJwu72uYaKjkekcmYTuiw7zUcyAo26u3/tXLvb0EfBqZ8DBG7P3RUdoMfJIWjCwxAhkTwEOd6DW0yAs/6OtXJwvaV9Nehxg2MAmfcbcberjvJ+rVIaFf2+V/5ZuSnFIwuTpqTiuHQGqwIDAQAB` |

**Supabase auth config on a new project:** set the site URL to
`https://xcrol.com`, add `https://xcrol.com/**`, `https://www.xcrol.com/**`
and the workers.dev escape pod to the redirect allowlist, and configure the
Google provider with the `xcrol-web` client credentials from escrow (add
the new project's callback URI in the Google console).

## 8. Re-schedule backups

Run the cron SQL in `BACKUP-ARCHITECTURE.md` with the new project ref +
`CRON_SECRET` (stored in Vault via `vault.create_secret`). Two jobs:
`nightly-backup` daily 04:00 UTC, `heartbeat-check` Sundays 05:00 UTC.

**Do not omit `timeout_milliseconds := 300000` from the `net.http_post`
calls.** pg_net's default timeout is 5 seconds, which a cold-starting edge
function can never beat — this single omission silently blocked every
nightly backup for 33 days while `cron.job_run_details` kept reporting
`succeeded`. After scheduling, confirm a real run using the verification
queries in `BACKUP-ARCHITECTURE.md` (look for a `kind='nightly'`
`backup_runs` row and a new B2 folder) before trusting the schedule.

Also update the GitHub repo secrets so CI points at the new project:
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`
(backend deploy) and the B2 read credentials used by `restore-verify.yml`.

## 9. Smoke test

- [ ] Sign in with an existing email/password account → **original password
      works** (hashes restored, no reset needed)
- [ ] Sign in with Google → account re-matches by email
- [ ] Request a password reset → email arrives, From is `noreply@invites.xcrol.com`
- [ ] Open the River → entries visible; scroll loads a second page
- [ ] Post a new entry
- [ ] Send a message
- [ ] View someone else's public profile — sensitive fields hidden
- [ ] `curl https://<ref>.supabase.co/functions/v1/health` → `"status":"healthy"`
- [ ] Admin dashboard → Backups tab → trigger a run against B2, check
      `errors: []` in the new manifest

You now have a fully self-contained Xcrol.
