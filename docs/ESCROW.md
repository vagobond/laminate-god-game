# Xcrol Escrow Package — Credential Inventory

> **This file contains NO secret values.** It is the map, not the treasure.
> Every credential a trustee needs to revive or maintain Xcrol is listed here,
> with what it unlocks and where the sealed value lives.
>
> The sealed values live in: **a KeePassXC vault file, `CD-estate-credentials.kdbx`**
> (open format, AES-256; open it with the free KeePassXC app on any OS).
> Copies exist in three places: a thumbdrive stored with the will, CD's
> Dropbox, and CD's Mac (`~/Documents/CD-Estate-Vault/`). The master
> passphrase is in a sealed envelope stored with the will. Vault created
> 2026-08-09; it also holds the wider estate credentials, not just Xcrol.
>
> Companion documents: `RUNBOOK.md` (how to revive), `BACKUP-ARCHITECTURE.md`
> (how backups work). Estate context: the will names CD's sister as
> executor/trustee; this package is the Xcrol section of that plan.

## Priority tiers

- **Tier 1 — without these, user data is lost.** B2 + GitHub.
- **Tier 2 — without these, users can't log in.** Google OAuth + Resend.
- **Tier 3 — without these, the site address breaks.** Domain registrar.
- **Tier 4 — conveniences.** Everything else; all replaceable.

## The inventory

| # | Tier | Credential | What it unlocks | Where the sealed value lives | Status |
|---|------|-----------|-----------------|------------------------------|--------|
| 1 | 1 | **Backblaze account login** (email + password + 2FA recovery) | B2 bucket `xcrol-backups` — all nightly snapshots incl. password hashes. Can mint new keys. | SEALED STORE | ☐ |
| 2 | 1 | **B2 application key (full access)** | Direct restore access without the account login | SEALED STORE (note: a read-only key also exists on CD's Mac in My Agent System `.env`) | ☐ |
| 3 | 1 | **GitHub account access OR successor designation** | Private repo `vagobond/xcrol` — full source, migrations, edge functions, this runbook | github.com/settings/admin → successor = sister (no secret value needed once set) | ☐ pending |
| 4 | 2 | **Google Cloud account login** (owns project `xcrol`, OAuth client `xcrol-web`) | OAuth client ID + secret — the 22 Google-identity users (17 OAuth-only) sign back in with zero friction only if the same client is reused | SEALED STORE | ☐ |
| 5 | 2 | **Google OAuth client ID + secret** (copy of the values themselves) | Same as #4 without needing console access; paste into new Supabase project's Google provider | SEALED STORE | ☐ |
| 6 | 2 | **Resend account login** | Auth SMTP (RUNBOOK 5a — REQUIRED for password resets on revival) + invite mail; domain `invites.xcrol.com` verified here | SEALED STORE | ☐ |
| 7 | 2 | **Resend API key `xcrol-auth-smtp`** | SMTP password for Supabase custom SMTP | SEALED STORE (or mint fresh from #6) | ☐ |
| 8 | 3 | **WordPress.com login** | `xcrol.com` registration + DNS (registered for max term) | SEALED STORE | ☐ |
| 9 | 4 | **Cloudflare account login** | Workers deploy pipeline (`xcrol.baldjesusnft.workers.dev`), escape-pod frontend | SEALED STORE | ☐ |
| 10 | 4 | **Mapbox account login** | `MAPBOX_PUBLIC_TOKEN` (or trustee switches to MapTiler per RUNBOOK) | SEALED STORE | ☐ |
| 11 | 4 | **Lovable account login** | Only relevant while Xcrol still lives on Lovable — lets trustee keep lights on / export. Dies at cutover. | SEALED STORE | ☐ |

## Deliberately NOT in escrow

- **Supabase service_role key / DB password** — not retrievable from Lovable
  Cloud, and not needed: revival = new project = new keys (RUNBOOK step 2).
  After cutover to CD-owned Supabase, ADD the Supabase account login to the
  sealed store and update this table.
- **`CRON_SECRET`** — regenerated on revival (RUNBOOK step 5).
- **`LOVABLE_API_KEY`** — unused by code; dies with Lovable.
- **Xcrol user passwords** — bcrypt hashes ride in the nightly backup itself
  (verified 2026-08-09: 66/66 present); no separate escrow needed.

## Trustee letter — required contents

The letter (delivered by the will or the dead-man's switch) must contain:

1. Where the sealed store is and how to open it.
2. One sentence: "Start with `docs/RUNBOOK.md` in the GitHub repo
   `vagobond/xcrol`; it assumes no prior knowledge."
3. The monthly cost expectation (~$0–45/mo depending on path) and permission
   to shut Xcrol down gracefully if reviving it isn't wanted — with the note
   that a data-export courtesy to users is possible via the B2 snapshots.

## Verification checklist (redo after cutover, then yearly)

- [ ] Every row above marked ☑ with a value confirmed present in the sealed store
- [ ] Sealed-store location written into the trustee letter
- [ ] GitHub successor designation shows sister as successor
- [ ] A B2 restore actually tested with ONLY the escrowed credentials (not CD's Mac)
