# Xcrol Code Audit — 2026-08-05

Scope: full repo at commit `00610bb` — 304 TypeScript/TSX files in `src/`,
26 edge functions, 176 migrations. Method: two automated survey passes
(security + code health) with key findings independently re-verified, plus
`npm audit --omit=dev` run against `package-lock.json` on 2026-08-05.

Confidence labels: **[verified]** = re-checked directly this session;
**[surveyed]** = automated pass, spot-checked but not exhaustively re-read.

---

## Overall verdict

The codebase is in good shape for its purpose: standard open tech, no
committed secrets, consistent auth patterns, RLS on the tables checked, and
XSS mitigations in the one place that renders raw HTML. No critical
vulnerability was found. The items below are portability gaps and hygiene,
roughly in priority order.

---

## Findings

### 1. Hardcoded Supabase project ID — breaks on revival **[verified]**
`src/components/public-profile/ProfileActionBar.tsx:80-81` builds OG-image
URLs from the literal `https://ceuaibqpikcvcnmuesos.supabase.co/...` instead
of `VITE_SUPABASE_URL`. Everything else in `src/` reads env vars correctly.
On revival to a new Supabase project these two lines would silently point at
the dead project. Two-line fix.

### 2. Social-share images served from xcrol.lovable.app **[verified]**
`index.html` lines 19, 23, 29: `og:image`, `twitter:image`, and the JSON-LD
`logo` all point at `https://xcrol.lovable.app/...`. When Lovable disappears,
link previews on social platforms lose their images (site itself unaffected).
Fix: point at `https://xcrol.com/og-image.png` etc. — the files are in
`public/` and served from the site's own origin.

### 3. Side apps hosted on Lovable **[verified]**
- `src/lib/widget-registry.ts:31` → `https://w3wu.lovable.app/embed/...`
- `src/components/settings/IntegrationsSection.tsx:8` → `https://xmap.lovable.app`

These are separate Lovable-hosted apps (W3WU, XMap). They are outside this
repo's control: if their Lovable hosting ends, the widget embed and the
integration link break. Not fixable here — noted so their migration can be
decided separately.

### 4. Dependency vulnerabilities — build chain only **[verified]**
`npm audit --omit=dev` (2026-08-05): 9 findings (8 high, 1 moderate) in
`picomatch`, `postcss`, `yaml`. All are build-time packages; the deployed
site is static files, so runtime exposure is minimal. `npm audit fix` claims
a clean fix path. Caution: running it rewrites lockfiles, which previously
caused a frozen-lockfile build failure — if applied, update `bun.lock` in the
same commit (`bun install`) and verify the Cloudflare build goes green.

### 5. Three lockfiles, one stale **[verified]**
`package-lock.json` and `bun.lock` are current; `bun.lockb` (binary, older
format) is stale as of Aug 3. Bun ignores `bun.lockb` when `bun.lock` exists,
but a stale third lockfile invites confusion for future tools. Option: delete
`bun.lockb`.

### 6. No tests **[surveyed]**
Zero test files in `src/` or `supabase/functions/`. The functions handling
auth (oauth-token), backups (nightly-backup), and data export are untested.
For a future AI-maintained repo this raises change risk: an agent editing
these functions has no safety net. Options range from doing nothing (current
manual smoke tests) to a small Deno test harness for the 3–4 critical
functions.

### 7. Remaining Lovable references — cosmetic **[verified]**
Besides items 2–3: `lovable-tagger` (dev-only, in `vite.config.ts` +
`package.json`), a docs example URL in
`src/pages/developers/QuickStartSection.tsx:101`, a comment in
`src/lib/scroll-ai.ts:5`, and README deploy instructions that still describe
the Lovable publish flow. None affect the running site; all removable in one
cleanup PR whenever convenient.

---

## Security summary **[surveyed, key items verified]**

- **Secrets:** nothing beyond the intentionally committed `VITE_*`
  publishable values. Service-role key used only inside edge functions via
  `Deno.env.get`.
- **Edge-function auth:** consistent pattern across the 26 functions —
  user-JWT verification, `x-cron-secret` for cron paths (nightly-backup also
  accepts an admin JWT, checked against `user_roles`), or intentionally
  public endpoints (health, public stats, OG pages). The OAuth provider
  functions validate client credentials, redirect URIs, PKCE (S256), and
  token expiry/revocation — `oauth-connection-degree`'s bearer-token check
  against `oauth_tokens` was re-verified directly.
- **SSRF:** `fetch-rss-feeds` and `link-preview` block private IP ranges and
  localhost before fetching.
- **XSS:** single `dangerouslySetInnerHTML` in
  `src/components/MarkdownContent.tsx` — input is HTML-escaped first and
  `javascript:` hrefs stripped.
- **RLS:** enabled on tables checked; the 5 `WITH CHECK (true)` policies
  [verified] are waitlist signup (public by design, 2×) and layer creation
  scoped `TO authenticated` (1× plus 2 superseded early policies).
- **Admin gating:** enforced server-side (`user_roles` lookup in
  `admin-delete-user` and `nightly-backup`), not just in the UI.
- **CORS:** wildcard `*` on function responses; acceptable because authz is
  enforced per-request, not by origin.

---

## Suggested PR groupings (when wanted)

1. **Portability fixes** — items 1 + 2 (three files, low risk, high revival value)
2. **Hygiene** — items 5 + 7 (delete `bun.lockb`, strip lovable-tagger + refs)
3. **Deps** — item 4 (`npm audit fix` + `bun install` in one commit, watch CI)
4. **Tests** — item 6 (only if desired; largest effort)
