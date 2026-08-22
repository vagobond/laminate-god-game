-- Usernames live at the top-level route /:username; a username equal to a
-- static route's first segment (admin, powers, map, ...) would make that
-- profile unreachable — the static route always wins. Enforce the reserved
-- list at the DB so no signup/edit path can mint one. Verified 2026-08-22
-- that no existing row holds a reserved name; NOT VALID skips the (already
-- clean) backfill scan while enforcing all new writes. Hyphenated route
-- segments are omitted: the username charset check (^[a-z0-9_]+$) already
-- excludes hyphens. Client mirror: src/lib/reserved-usernames.ts.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_not_reserved
  CHECK (
    username IS NULL OR username NOT IN (
      'admin','auth','brook','developers','group','hearthsurf','host',
      'library','map','messages','myxcrol','oauth','post','powers',
      'privacy','profile','scrolls','settings','terms','u','xcrol',
      'embed','card','assets','api','functions','rest','storage',
      'welcome','home','login','logout','signup','search','about',
      'help','support','notifications'
    )
  ) NOT VALID;
