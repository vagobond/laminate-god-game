# Fix 1 — Nightly backup cron timeout

## Confirmed current state

`cron.job` has three jobs. The relevant one, `nightly-backup-0400-utc` (`0 4 * * *`), calls the backup function with **no `timeout_milliseconds` argument** — so pg_net applies its 5-second default and kills the request during the edge function's cold start. That matches the `Timeout of 5000 ms reached` entries in `net._http_response` and the absence of any `kind='nightly'` row in `backup_runs`.

`heartbeat-check` is **not scheduled at all** — the dead-man's switch has never had a trigger.

## What gets changed

### 1. Reschedule the backup job with a real timeout

Applied live via the insert tool (not a migration — the URL and Vault reference are project-specific and must not ship to forks):

```sql
select cron.unschedule('nightly-backup-0400-utc');

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
```

Everything else about the job is preserved verbatim — same name, same schedule, same Vault-backed secret lookup. The only addition is `timeout_milliseconds := 300000`.

### 2. Schedule the heartbeat job

`heartbeat-check` gets a weekly job (`0 5 * * 0`) with the same Vault secret pattern and the same 300s timeout. It stays inert until `DEADMAN_ENABLED` and `TRUSTEE_EMAIL` are set (Fix 2), but the trigger will exist and be proven.

### 3. Immediate proof

Right after scheduling, invoke `nightly-backup` once by hand with the cron secret so a full run happens now rather than waiting until 04:00 UTC. Then verify:

- a `backup_runs` row with `kind='nightly'` and `status='success'`
- a non-zero `files_uploaded` and a `manifest_key` under today's `xcrol/` prefix
- `net._http_response` showing status 200 instead of a timeout

If the manual run reveals the function needs longer than 300s, the timeout gets raised before the scheduled job's first firing.

### 4. Documentation — part of the fix, not an afterthought

`docs/BACKUP-ARCHITECTURE.md` currently prints the cron SQL **without** `timeout_milliseconds`, and with a hardcoded `<CRON_SECRET>` in the header instead of the Vault lookup. A stranger reviving Xcrol from that doc reproduces the never-ran bug exactly. Both `docs/BACKUP-ARCHITECTURE.md` and `docs/RUNBOOK.md` get:

- the corrected SQL above, verbatim, for both jobs
- an explicit warning that pg_net defaults to a 5-second timeout and that a cold-starting edge function will always exceed it
- an explicit warning that a `succeeded` row in `cron.job_run_details` proves only that the HTTP call was *issued*; the only proof a backup ran is a `backup_runs` row with `kind='nightly'` plus the matching B2 prefix

### 5. Secret-inventory correction

While in the file, `nightly-backup/index.ts`'s `secretInventory` array is corrected: `MAPBOX_TOKEN` → `MAPBOX_PUBLIC_TOKEN` (the real name; the manifest has been silently omitting it from every backup), and the now-unused `LOVABLE_API_KEY` is not added since it dies with Lovable and has no revival value. The escrow list in the runbook gains `MAPBOX_PUBLIC_TOKEN`.

## Not in this slice

Fixes 2 (dead-man's switch secrets), 3 (BYO Google OAuth), 4 (auth email ownership), and 5 (storage byte sync) are untouched.

## Technical notes

- No frontend changes; no migration files.
- One live SQL statement set, one edge function file edit, two doc edits.
- `nightly-backup` already distinguishes `kind='nightly'` (cron secret) from `kind='manual'` (admin JWT), so the manual proof run must send `x-cron-secret` to produce a `nightly` row.
