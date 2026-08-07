# Xcrol Escrow & Trustee Package

This file lists everything that must exist **outside this repository** for a
trustee to revive Xcrol using `RUNBOOK.md`. It contains no secret values —
only what the secrets are, why each is needed, and where it should live.

The 2026-08-06 dry-run revival (`DRYRUN-2026-08-06.md`) proved the technical
path works. This document closes the human path: making sure the right person
holds the right keys when the operator is unavailable.

## 1. The trustee letter

A single document, stored with the operator's will / lawyer / heirs (NOT in
this repo, NOT in email), containing:

| Item | Why the trustee needs it |
| ---- | ------------------------ |
| Backblaze B2 account login (or a read-write application key for `xcrol-backups`) | All user data lives here. Without it: app revives, data doesn't. |
| GitHub access path (see section 2) | Full source, migrations, edge functions, this runbook. |
| WordPress.com account login | `xcrol.com` registration + DNS. Registered for the maximum term, so renewal is not urgent — but DNS changes (RUNBOOK step 7) require this login. |
| Google Cloud account access (project `xcrol`, OAuth client `xcrol-web`) | Google sign-in. ~22 users are Google-identity; 17 are OAuth-ONLY and cannot log in any other way without this. |
| Resend account login | Auth email (password resets) via SMTP — RUNBOOK 5a. Critical because restored users may need password resets. |
| One line: **"Start at `docs/RUNBOOK.md` in the repo. Budget 3 hours and ~$25/mo."** | Orientation. |

Not needed: anything from Supabase or Lovable. Revival creates a fresh
Supabase project with fresh keys (RUNBOOK step 2).

## 2. GitHub access for the trustee

The repo is private, so plan two independent paths:

**Path A — GitHub successor designation (do this now, takes 2 minutes):**

1. Go to <https://github.com/settings/admin> (Account settings → Account)
2. Under **Successor settings**, enter the successor's GitHub username and
   click **Add successor**
3. The successor gets an invitation on GitHub they must **accept**

After death verification (death certificate etc.), the successor can manage
or archive the account's repositories per GitHub's Deceased User Policy.
Note: verify current GitHub policy on how many successors are allowed and
exactly what access they receive — re-check when circumstances change (e.g.
adding a second successor later).

**Path B — escrowed read-only deploy key (belt and suspenders):**

Generate a dedicated SSH deploy key (read-only) for the repo, and store the
private key in the trustee letter. This guarantees `git clone` access
regardless of GitHub account-recovery friction. (Same mechanism as the
existing time-limited "Claude 30 Day" key, but permanent and escrowed.)

```bash
ssh-keygen -t ed25519 -f xcrol_trustee_deploy -C "xcrol trustee escrow"
# Add the .pub as a read-only deploy key: repo → Settings → Deploy keys
# Put the PRIVATE key file in the trustee letter. Do not keep other copies.
```

## 3. Dead-man switch

The notification mechanism is wired in the codebase but **disarmed**:
`TRUSTEE_EMAIL`, `DEADMAN_ENABLED`, `DEADMAN_DAYS` are unset in the secrets
store. Options:

- **Leave disarmed** and rely on the will/lawyer to deliver the trustee
  letter. Simplest; no false-positive risk; delivery depends on estate
  process speed.
- **Arm it** with a trustee email and a generous window (e.g. 60–90 days of
  operator inactivity). Faster delivery; small risk of a false alarm during
  long offline stretches — the operator travels extensively, so pick the
  window accordingly.

Decision pending — this document should be updated when the will is executed.

## 4. Open items checklist

- [ ] Designate GitHub successor (section 2, path A)
- [ ] Generate + escrow the trustee deploy key (section 2, path B)
- [ ] Write the trustee letter (section 1) and store it with the will
- [ ] Decide arm/disarm for the dead-man switch (section 3)
- [ ] When the will is drafted, reference this file and RUNBOOK.md in it
