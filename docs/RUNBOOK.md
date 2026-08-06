# Xcrol Revival Runbook

If you are reading this because the original operator is unavailable, this
document tells you exactly how to bring Xcrol back online from the backup
bundle + GitHub mirror.

You will need: a credit card, a domain registrar login (the `xcrol.com`
registration), and ~3 hours.

## 0. What you have
1. **Backblaze B2 bucket** `xcrol-backups` — daily snapshots (last 90 days).
2. **GitHub repository mirror** — full app source, migrations, edge functions.
3. **The trustee letter** (if delivered via deadman switch) — contains B2
   access credentials and any context the operator left.

If you are missing the B2 credentials, contact the operator's heirs / lawyer;
without them, you can still revive the *application* from GitHub but you will
lose all user data.

## 1. Choose a hosting path

| Path | Monthly cost | Effort | When to choose |
| ---- | ------------ | ------ | -------------- |
| **A. Managed Supabase + Cloudflare Pages** | ~$25–45 | low | You want minimum ops work |
| **B. Self-hosted Supabase on Hetzner** | ~$8–15 | medium | You want full sovereignty |

Both paths share steps 2–6.

## 2. Provision the backend

### Path A — managed Supabase
1. Sign up at supabase.com, create a new project in your region of choice.
2. Note the project ref, anon key, service role key, and DB URL.
3. Enable the `pg_cron` and `pg_net` extensions (Database → Extensions).

Free-tier fit (checked 2026-08-05): database backup <1 MB and storage ~52 MB
vs limits of 500 MB / 1 GB — comfortable. Caveat: Supabase pauses free
projects after ~1 week of zero activity. Live traffic plus the nightly backup
cron should prevent that, but if the project ever pauses, restore it from the
dashboard and check whether the crons resumed.

### Path B — self-hosted Supabase
1. Spin up a Hetzner CPX21 (or larger) running Ubuntu.
2. Follow https://supabase.com/docs/guides/self-hosting/docker — set strong
   `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`.
3. Put it behind Caddy with a TLS cert.

## 3. Restore the schema
From the GitHub mirror:

```bash
git clone <mirror-url> xcrol && cd xcrol
# Apply migrations in order. Each migration is idempotent w.r.t. its own
# CREATE statements; run them with the Supabase CLI:
npx supabase link --project-ref <new-ref>
npx supabase db push
```

This recreates every table, RLS policy, function, trigger, and grant.

## 4. Restore the data

Pick the most recent successful backup folder in B2 (look for a folder that
contains a `manifest.json.gz` with `errors: []`).

```bash
# Install the B2 CLI and authenticate
pip install b2
b2 account authorize <key-id> <application-key>

# Pull the snapshot you want
b2 sync b2://xcrol-backups/xcrol/2026-06-04/<timestamp> ./snapshot
gunzip ./snapshot/db/*.gz ./snapshot/auth/*.gz ./snapshot/storage/*.gz

# Load each table. Order matters because of FKs — load parents first.
# A pragmatic order:
for t in profiles user_roles user_settings user_invites \
         friendships friendship_requests custom_friendship_types blocked_users \
         introduction_requests references messages \
         brooks brook_posts brook_comments brook_reactions \
         groups group_members group_join_requests group_posts group_post_comments group_post_reactions group_visits \
         xcrol_entries xcrol_reactions river_replies river_reply_reactions \
         scrolls scroll_items scroll_publications scroll_publication_reactions \
         social_links personal_info profile_widgets \
         hosting_preferences meetup_preferences hosting_requests meetup_requests \
         town_listings developer_apps oauth_authorizations rss_feeds \
         waitlist deletion_requests audit_log user_points; do
  echo "Loading $t..."
  # Re-build INSERTs from NDJSON, or use this one-liner with jq + psql:
  jq -rc --arg t "$t" '[. ] | "INSERT INTO public.\($t) SELECT * FROM jsonb_populate_recordset(NULL::public.\($t), $1::jsonb);"' \
    ./snapshot/db/$t.ndjson | \
    while read sql; do psql "$DATABASE_URL" -c "$sql"; done
done
```

(Simpler: write a 20-line Node script that reads each NDJSON file and calls
`supabase.from(table).insert(rows)` in 500-row batches with the service key.)

### 4a. Restore auth users (preserving passwords)
The dump includes `encrypted_password`. Use the Supabase admin API:

```ts
import { createClient } from "@supabase/supabase-js";
const admin = createClient(URL, SERVICE_ROLE_KEY);
for (const u of usersFromDump) {
  await admin.auth.admin.createUser({
    id: u.id, email: u.email,
    email_confirm: !!u.email_confirmed_at,
    password_hash: u.encrypted_password, // bcrypt hash from old project
    user_metadata: u.user_metadata,
    app_metadata: u.app_metadata,
  });
}
```

Users keep their original passwords.

### 4b. Storage
The backup contains an object catalog, not bytes. If the original Supabase
project is still reachable, re-download objects directly from there. Otherwise
storage objects are lost; users will need to re-upload avatars and Xcrol will
auto-regenerate OG images.

## 5. Re-create secrets
The manifest lists every secret name that was set at backup time. You must
re-provision values yourself:

| Secret | Where to get a new value |
| ------ | ------------------------ |
| `RESEND_API_KEY` | resend.com → API keys |
| `MAPBOX_PUBLIC_TOKEN` | mapbox.com → tokens (or switch to MapTiler) |
| `B2_KEY_ID` | reuse the bucket above |
| `B2_APPLICATION_KEY` | reuse the bucket above |
| `B2_BUCKET_NAME` | reuse the bucket above |
| `CRON_SECRET` | generate a fresh random string, and store it in Vault too |

`LOVABLE_API_KEY` is Lovable-managed and has no revival value — Xcrol no longer
calls Lovable AI at all (Scrolls AI is bring-your-own-key), so leave it unset.

### 5a. Auth email (SMTP) — REQUIRED, or resets/confirmations silently fail
On the original project, Supabase *auth* mail (signup confirmations, password
resets, email-change confirmations) is sent by Lovable's default shared sender.
That path dies with Lovable. App mail (invites) already uses our own Resend and
is unaffected.

On the new project, wire auth mail to our Resend account:

Supabase dashboard → **Authentication → Emails → SMTP settings** → enable
**Custom SMTP**:

| Field | Value |
| ----- | ----- |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literally) |
| Password | a Resend API key (resend.com → API keys; a dedicated key named `xcrol-auth-smtp` may already exist) |
| Sender email | `noreply@invites.xcrol.com` (domain already verified in Resend) — or verify a new subdomain like `auth.xcrol.com` in Resend first |
| Sender name | `Xcrol` |

Then send yourself a password reset and confirm the From address.

**Do NOT use any wizard that asks you to add NS records pointing at
`*.lovable.cloud`.** Lovable's "Emails" domain-connect flow (offered 2026-08-05
for `auth.xcrol.com`) works by delegating `notify.auth.xcrol.com` to
`ns5/ns6.lovable.cloud` — a Lovable-controlled DNS zone, i.e. the same
dependency this runbook exists to remove. It was deliberately rejected; those
records were never added to xcrol.com's DNS (hosted at WordPress.com).

Note: Lovable's dashboard does not expose Supabase's custom-SMTP setting
anywhere (checked 2026-08-05), so while the app lives on Lovable Cloud this
dependency is accepted. The management-API route was also attempted via the
Lovable AI agent (2026-08-06) and is **not** available: Lovable Cloud projects
have no Supabase personal access token, and `api.supabase.com` rejects every
credential reachable from the agent sandbox (anon key and `LOVABLE_API_KEY`
both return 401). The agent's auth-configuration tool exposes only signup /
anonymous / auto-confirm / HIBP / email rate-limit — no SMTP fields. Therefore
custom SMTP can only be set **after** migrating to a Supabase project you own
(step 2 above), where it is a 2-minute dashboard change. Until then, auth mail
goes out via Lovable's shared sender and dies with Lovable — which is why 5a is
a REQUIRED revival step, not an optional one.


## 6. Deploy the frontend
Cloudflare Pages: connect to the GitHub mirror, set build command `bun run build`,
output `dist`. Set env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID` from the new Supabase project.

Vercel: same idea — framework "Vite", same env vars.

## 7. Point DNS
Update `xcrol.com` A/CNAME records to the new host. TTL low (300s) for the
first 24 hours so you can revert quickly.

## 8. Smoke test
- [ ] Sign in with an existing account → password works
- [ ] Request a password reset → email arrives, From address is ours (see 5a)
- [ ] Open the River → entries visible
- [ ] Post a new entry
- [ ] Send a message
- [ ] View someone else's public profile
- [ ] Admin dashboard → Backups tab → trigger a run against the new B2 bucket

## 9. Re-schedule backups
On the new project, re-run the cron SQL in `BACKUP-ARCHITECTURE.md` with the
new project ref + `CRON_SECRET`.

**Do not omit `timeout_milliseconds := 300000` from the `net.http_post` calls.**
pg_net's default timeout is 5 seconds, which a cold-starting edge function can
never beat — this single omission silently blocked every nightly backup on the
original project for 33 days while `cron.job_run_details` kept reporting
`succeeded`. After scheduling, confirm a real run using the two verification
queries in `BACKUP-ARCHITECTURE.md` before trusting the schedule.

## 10. Ongoing maintenance without Lovable (works with any AI tool)
The codebase is standard open tech (Vite/React, Supabase, SQL migrations, Deno
edge functions) — nothing proprietary. Any agentic coding tool (GitHub Copilot
agent mode, Cursor, Claude, etc.) can maintain it. The workflow that replaces
Lovable's "type a sentence, see it live":

1. AI tool makes the code change and opens a PR
2. Human merges the PR on GitHub
3. Frontend deploys automatically (Cloudflare Workers Builds, already live —
   see `wrangler.jsonc`)
4. Backend deploys via Supabase CLI: `supabase db push` for migrations,
   `supabase functions deploy` for edge functions

**TODO (set up during the dry-run revival):** a GitHub Action that runs step 4
automatically on merge to main, so backend changes deploy with zero terminal
work. It needs two repo secrets: `SUPABASE_ACCESS_TOKEN` (dashboard → account →
access tokens) and `SUPABASE_PROJECT_REF`. Until it exists, step 4 is a manual
CLI command.

You now have a fully self-contained Xcrol.
