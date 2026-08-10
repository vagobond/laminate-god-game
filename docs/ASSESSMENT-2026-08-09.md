# Xcrol Assessment — 2026-08-09

All findings verified live in the 2026-08-09 session (code, database via psql, live endpoints) or from cutover-verified memory.

**Baseline:** xcrol.com serving 200 via Cloudflare Worker; Supabase `wmatvlxehyaufhjljtby` (ap-southeast-2); 49,513 LOC TS/TSX; 42 pages / 46 routes; 71 public tables, all RLS-enabled, 236 policies, 84 RPCs; 178 migrations in sync; DB 23MB; ~83 users; live stats: entries_today=1, hometowns=42, countries=16, brooks_active=2.

---

## Worklist (agreed 2026-08-09 — work through one at a time)

Ordered by severity/leverage. Check off as completed.

### Technical fixes
- [x] **1. Hash OAuth tokens at rest.** DONE 2026-08-10 (migration 20260810120000, hashed in place per CD — never wipe; verified live). `oauth_tokens` stores access/refresh tokens as raw 64-char hex, returned directly from selects (client secrets already correctly hashed via pgcrypto). Fix: store `sha256(token)`, compare hashes on lookup. Migration must handle 148 existing rows (likely: invalidate + force re-auth, or one-time hash-in-place since tokens are opaque). Note: plaintext tokens exist in prior B2 nightly backups — decide whether to prune/rotate.
- [x] **2. Add rate limiting.** DONE 2026-08-10 (PR #11): per-IP fixed-window limits on all 12 public edge functions via `check_rate_limit()` RPC (migration 20260811000000) + `_shared/ratelimit.ts` (fail-open, 429 + Retry-After). The CF WAF path suggested here was rejected — function traffic goes direct to the supabase.co domain and never transits Cloudflare. Burst-verified live: 30×200 then 429 on get-public-stats; oauth-token unaffected for normal traffic. health + cron-guarded functions deliberately unlimited.
- [x] **3. RLS/visibility test suite.** DONE 2026-08-10 (PR #12): `supabase/tests/rls_visibility.sql` — 14 assertions covering the entry visibility ladder (anon/stranger/buddy/close_friend/secret_friend/owner), block-beats-friendship, secret-friendship concealment, blocks visible to blocker only, and profiles sensitive-column lockdown — run by `.github/workflows/rls-tests.yml` on every `supabase/**` PR/push against a from-zero replay of all migrations. CI quirks solved: seed the hardcoded admin auth user before migrations (`supabase db start` auto-applies them), and mirror hosted Supabase's default table grants pre-migration so RLS (not missing grants) is what's tested. Known-and-documented behavior: blocked users still see public entries. Verified green on main (2059f9c). Original scope: Zero tests in 49.5K LOC. Minimum viable: "user A cannot see user B's private entry / secret friendship / blocked content" against a shadow DB in CI, run after migrations. This guards the 236 policies that ARE the product's trust promise.
- [ ] **4. River query scalability.** `get_river_entries` calls `can_view_xcrol_entry()` per row (O(all entries), no index pruning) + OFFSET pagination. Fix shape: visibility as joinable WHERE conditions, keyset (created_at, id) pagination. First scaling wall — hits at low tens of thousands of entries.
- [ ] **5. Connection-degree BFS.** `get_connection_degree_fast` = query-time recursive CTE over `friendship_pairs`, max_depth 3. Cheap now; wall #2 at a few thousand densely-connected users. Also: README says "6 degrees," function defaults to 3 — fix the doc (cheaper) or the default.
- [ ] **6. Uptime monitoring.** Nothing alerts if xcrol.com or the health function goes down. Free UptimeRobot-class check on the health endpoint.
- [ ] **7. Arm the dead-man's switch.** Built but unarmed — TRUSTEE_EMAIL / DEADMAN_* secrets unset. Needs trustee email from CD.
- [ ] **8. RUNBOOK refresh.** Predates the cutover; contains dead Lovable-era paths. Successor following it today would fail.
- [ ] **9. 140 vs 240 characters.** Product/README = 240; CD's framing said 140. Decide canonical number before it appears in public copy.

### CD decisions (product/philosophy — options, not prescriptions)
- [ ] **10. The Castle 60/40 revenue split** vs "not designed to make money." Options: reframe as creator-support pass-through, or shelve until organic demand.
- [ ] **11. Secret Enemy.** Concealed-antagonism feature on a trust-engine platform. Deliberate keep / cut / reframe decision.
- [ ] **12. Points system invariant.** If points never gate visibility/ordering, the no-algorithm claim holds — currently enforced by nothing. Could be covered by a test in item 3.
- [ ] **13. Nav breadth vs population.** ~8 products for 83 users; empty Town/Meetups next to a live River reads as abandonment. Option: progressive disclosure — hide sections until density exists. Code stays, nav shrinks.
- [ ] **14. Single region (Sydney) for 16-country userbase.** Correct today (free tier). Known rooted decision; region move later = dump/restore.

---

## 1. Where the architecture genuinely serves the mission

The "lean, near-free, no algorithm" goal is structurally enforced, not just stated:

- **Chronological river, no ranking layer.** `get_river_entries` sorts by `created_at DESC`, full stop. No engagement scoring anywhere in the schema. "No algorithm" is architecturally true.
- **RLS on all 71 tables, no exceptions**, with SECURITY DEFINER RPCs for PII. Privacy enforced at the database layer, not the app layer.
- **BYOK AI** (`scroll-ai.ts`): user keys never touch Xcrol servers. Zero cost, zero data custody.
- **Cost profile verified near-free:** static frontend on free Cloudflare Worker, one free-tier Supabase project, Resend/B2 at pennies.
- **Frontend engineering:** 39/46 routes lazy-loaded, 186KB gz main bundle, mapbox isolated in its own chunk.
- **Backup chain** better than most funded startups: nightly to B2, weekly heartbeat, automated restore-verify with 48h freshness gate, escrow doc.

The 240-character limit is the best product idea in the project: it makes the no-algorithm design *viable* (240 chars × 200 people = readable daily surface), not merely principled.

## 2. Structural / architectural errors

**a. Plaintext OAuth tokens at rest** — the one genuine security error. See worklist #1. DB read compromise yields usable credentials for every third-party integration; plaintext persists in backups.

**b. No rate limiting** — worklist #2. Failure mode is cost, not abuse: one buggy client or hostile invitee looping an edge function is the most plausible way "free" dies. Waitlist/invite codes gate signup only.

**c. River query O(all entries)** — worklist #4. Fine at 360 entries; breaks with the product's own success metric (~73K entries/year at 200 daily posters). Treat the RPC as v1-disposable.

**d. Query-time BFS for connection degree** — worklist #5. Plus README "6 degrees" vs max_depth 3 mismatch.

**e. Zero tests, 178 migrations** — worklist #3. The dangerous failure isn't a broken feature; it's a migration silently loosening a policy on a platform whose pitch is trust.

**f. Single region, global product** — worklist #14. Every DB round trip is Sydney; EU/US users see 200–300ms/query. Correct choice today, rooted decision.

## 3. Product-design tensions

- **Castle 60/40 revenue split** inside a declared non-business — legible contradiction to skeptical newcomers (worklist #10).
- **Secret Enemy** — the single feature a journalist or wary user would seize on (worklist #11).
- **Points system** — any accumulating score is a proto-algorithm/status-economy; the "never gates visibility" invariant is unenforced (worklist #12).
- **Scope breadth vs. user count** — River + Village + Town + Hearthsurf + Meetups + Scrolls + Castle + OAuth platform for 83 users / 1 entry today. Cost is coherence, not money: empty rooms make the live room feel abandoned (worklist #13).
- **OAuth provider ambition is real and working** (baoism.org consumes it) — rare at this size, and also the largest attack/maintenance surface (both the plaintext-token and no-rate-limit findings live there). Deserves the most hardening per line of code.

## 4. Operational resilience (succession lens)

Constraint: nothing operational may depend on Claude after ~Sept 2026.

- Backup/restore-verify chain: done and good.
- Dead-man's switch: built, not armed (worklist #7).
- Uptime monitoring: none (worklist #6).
- RUNBOOK: predates cutover (worklist #8).
- Bus factor: honestly 1 — mitigated by escrow + backups; items 6–8 turn "recoverable in principle" into "recoverable in practice."

## Bottom line

Stated values are unusually well-embedded in the architecture — no-algorithm, near-free, and privacy-by-RLS are verifiably true. Engineering quality is above what the project's size predicts, especially backups and code-splitting. Genuine defects are few and specific (tokens, rate limiting, river query, tests); the strategic tension is breadth plus two features that quietly contradict the manifesto. All failure modes are known-shape problems with cheap mitigations — they need to be chosen deliberately rather than arrived at.
