-- ============================================================================
-- RLS / visibility test suite (docs/ASSESSMENT-2026-08-09.md, worklist #3)
--
-- Asserts the privacy promises that ARE the product: the entry visibility
-- ladder, secret friendships, blocks, and the profiles column lockdown.
--
-- Run as the postgres superuser against a freshly migrated database:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_visibility.sql
--
-- The whole suite runs inside one transaction and ends with ROLLBACK —
-- it never leaves data behind, so it is also safe against a dev database.
--
-- Mechanism: RLS policies resolve auth.uid() from request.jwt.claims, so each
-- check impersonates a user with SET LOCAL ROLE + set_config(claims). Claims
-- persist to end of transaction, so EVERY check sets them explicitly.
--
-- Fixture uuids (valid v4-format, reserved test range):
--   alice 00000000-0000-4000-8000-00000000000a  (author of all entries)
--   bob   00000000-0000-4000-8000-00000000000b  (buddy of alice)
--   carol 00000000-0000-4000-8000-00000000000c  (secret_friend of alice)
--   dave  00000000-0000-4000-8000-00000000000d  (close_friend of alice)
--   eve   00000000-0000-4000-8000-00000000000e  (buddy of alice AND blocked by her)
--   frank 00000000-0000-4000-8000-00000000000f  (stranger)
-- ============================================================================

\set ON_ERROR_STOP on

begin;

-- ---------------------------------------------------------------------------
-- Seed. handle_new_user trigger auto-creates public.profiles rows.
-- ---------------------------------------------------------------------------
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select
  u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  u.email, '', '{"provider":"email","providers":["email"]}', '{}', now(), now()
from (values
  ('00000000-0000-4000-8000-00000000000a'::uuid, 'rls-alice@test.local'),
  ('00000000-0000-4000-8000-00000000000b'::uuid, 'rls-bob@test.local'),
  ('00000000-0000-4000-8000-00000000000c'::uuid, 'rls-carol@test.local'),
  ('00000000-0000-4000-8000-00000000000d'::uuid, 'rls-dave@test.local'),
  ('00000000-0000-4000-8000-00000000000e'::uuid, 'rls-eve@test.local'),
  ('00000000-0000-4000-8000-00000000000f'::uuid, 'rls-frank@test.local')
) as u(id, email);

-- One entry per privacy level. one_entry_per_day forces distinct entry_dates.
-- The close_friend entry carries a geo-pin: pins are columns on the entry row,
-- so pin visibility must inherit the entry ladder (section 6 asserts this).
insert into public.xcrol_entries (user_id, content, privacy_level, entry_date, latitude, longitude, location_label) values
  ('00000000-0000-4000-8000-00000000000a', 'public entry',       'public',                current_date,     null,      null,       null),
  ('00000000-0000-4000-8000-00000000000a', 'private entry',      'private',               current_date - 1, null,      null,       null),
  ('00000000-0000-4000-8000-00000000000a', 'buddy entry',        'buddy',                 current_date - 2, null,      null,       null),
  ('00000000-0000-4000-8000-00000000000a', 'close friend entry', 'close_friend',          current_date - 3, 43.190717, 140.994662, 'Otaru'),
  ('00000000-0000-4000-8000-00000000000a', 'acquaintance entry', 'friendly_acquaintance', current_date - 4, null,      null,       null);

-- Friendships FROM alice (can_view_xcrol_entry matches user_id -> friend_id
-- direction). The matview refresh trigger is irrelevant to RLS — skip it.
alter table public.friendships disable trigger refresh_friendship_pairs_trigger;
insert into public.friendships (user_id, friend_id, level) values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b', 'buddy'),
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000c', 'secret_friend'),
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000d', 'close_friend'),
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000e', 'buddy');
alter table public.friendships enable trigger refresh_friendship_pairs_trigger;

-- Extra fixtures for section 9 (friendships RLS tighten): incoming edges to alice.
insert into public.friendships (user_id, friend_id, level) values
  ('00000000-0000-4000-8000-00000000000f'::uuid, '00000000-0000-4000-8000-00000000000a'::uuid, 'secret_enemy'),   -- frank secretly marks alice his enemy
  ('00000000-0000-4000-8000-00000000000b'::uuid, '00000000-0000-4000-8000-00000000000a'::uuid, 'buddy')  -- bob has alice as buddy (visible incoming)
on conflict do nothing;

-- Alice blocks eve. The block must beat eve's buddy friendship.
insert into public.user_blocks (blocker_id, blocked_id) values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000e');

-- ===========================================================================
-- 1. Entry visibility ladder on xcrol_entries
-- ===========================================================================

\echo '[1a] anonymous sees only the public entry'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 1 then
    raise exception 'FAIL: anon sees % of alice''s entries, expected 1 (public only)', n;
  end if;
end $$;
reset role;

\echo '[1b] stranger (frank) sees only the public entry'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 1 then
    raise exception 'FAIL: stranger sees % of alice''s entries, expected 1 (public only)', n;
  end if;
end $$;
reset role;

\echo '[1c] buddy (bob) sees public + buddy + acquaintance, NOT close_friend, NOT private'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
do $$
declare n int; leaked int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 3 then
    raise exception 'FAIL: buddy sees % entries, expected 3', n;
  end if;
  select count(*) into leaked from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a'
      and privacy_level in ('private', 'close_friend');
  if leaked <> 0 then
    raise exception 'FAIL: buddy can see % private/close_friend entries of alice', leaked;
  end if;
end $$;
reset role;

\echo '[1d] close friend (dave) sees everything except private'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);
do $$
declare n int; leaked int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 4 then
    raise exception 'FAIL: close friend sees % entries, expected 4', n;
  end if;
  select count(*) into leaked from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a' and privacy_level = 'private';
  if leaked <> 0 then
    raise exception 'FAIL: close friend can see alice''s private entry';
  end if;
end $$;
reset role;

\echo '[1e] secret friend (carol) ranks with close friend: everything except private'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 4 then
    raise exception 'FAIL: secret friend sees % entries, expected 4', n;
  end if;
end $$;
reset role;

\echo '[1f] blocked user (eve) sees only public despite her buddy friendship'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  -- NOTE: encodes CURRENT behavior — public entries stay visible to blocked
  -- users (can_view_xcrol_entry returns true for 'public' before block check).
  if n <> 1 then
    raise exception 'FAIL: blocked user sees % of alice''s entries, expected 1 (public only)', n;
  end if;
end $$;
reset role;

\echo '[1g] owner (alice) sees all five of her entries'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 5 then
    raise exception 'FAIL: owner sees % of her own entries, expected 5', n;
  end if;
end $$;
reset role;

-- ===========================================================================
-- 2. Secret friendships stay secret
-- ===========================================================================

\echo '[2a] third party (frank) sees alice''s non-secret friendships but never the secret one'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare n int; secret int;
begin
  select count(*) into n from public.friendships
    where user_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 3 then
    raise exception 'FAIL: third party sees % of alice''s friendships, expected 3 (bob/dave/eve)', n;
  end if;
  select count(*) into secret from public.friendships
    where friend_id = '00000000-0000-4000-8000-00000000000c';
  if secret <> 0 then
    raise exception 'FAIL: third party can see the secret friendship (alice->carol)';
  end if;
end $$;
reset role;

\echo '[2b] the secret friend (carol) CAN see her own secret friendship'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000c","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.friendships
    where user_id = '00000000-0000-4000-8000-00000000000a'
      and friend_id = '00000000-0000-4000-8000-00000000000c';
  if n <> 1 then
    raise exception 'FAIL: secret friend cannot see her own secret friendship';
  end if;
end $$;
reset role;

-- ===========================================================================
-- 3. Blocks are private to the blocker
-- ===========================================================================

\echo '[3a] blocker (alice) sees her block row'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.user_blocks
    where blocker_id = '00000000-0000-4000-8000-00000000000a';
  if n <> 1 then
    raise exception 'FAIL: blocker sees % of her own block rows, expected 1', n;
  end if;
end $$;
reset role;

\echo '[3b] the blocked user (eve) cannot see that she is blocked'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.user_blocks;
  if n <> 0 then
    raise exception 'FAIL: blocked user can see % block rows (should never learn she is blocked)', n;
  end if;
end $$;
reset role;

\echo '[3c] third party (frank) sees no block rows'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.user_blocks;
  if n <> 0 then
    raise exception 'FAIL: third party can see % block rows', n;
  end if;
end $$;
reset role;

-- ===========================================================================
-- 4. Profiles column lockdown (sensitive PII readable only via RPCs)
-- ===========================================================================

\echo '[4a] authenticated stranger cannot SELECT sensitive profile columns'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
begin
  begin
    perform phone_number from public.profiles limit 1;
    raise exception 'FAIL: authenticated role can read profiles.phone_number — column lockdown broken';
  exception when insufficient_privilege then
    null;  -- expected: permission denied for the column
  end;
  begin
    perform home_address from public.profiles limit 1;
    raise exception 'FAIL: authenticated role can read profiles.home_address — column lockdown broken';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

\echo '[4b] anon cannot SELECT sensitive profile columns'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
begin
  begin
    perform private_email from public.profiles limit 1;
    raise exception 'FAIL: anon role can read profiles.private_email — column lockdown broken';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

-- ===========================================================================
-- 5. get_river_entries parity (worklist #4 — the river RPC must enforce the
--    exact same visibility ladder as the RLS policies above) + keyset paging
-- ===========================================================================

-- Distinct created_at per entry so keyset ordering is exercised for real
-- (seeded rows all share now() otherwise).
update public.xcrol_entries
  set created_at = entry_date::timestamptz
  where user_id = '00000000-0000-4000-8000-00000000000a';

\echo '[5a] river visibility matches the entry ladder for every viewer'
do $$
declare
  viewer uuid; expected int; got int;
begin
  for viewer, expected in
    select * from (values
      (null::uuid,                                   1),  -- anonymous
      ('00000000-0000-4000-8000-00000000000f'::uuid, 1),  -- stranger frank
      ('00000000-0000-4000-8000-00000000000b'::uuid, 3),  -- buddy bob
      ('00000000-0000-4000-8000-00000000000d'::uuid, 4),  -- close friend dave
      ('00000000-0000-4000-8000-00000000000c'::uuid, 4),  -- secret friend carol
      ('00000000-0000-4000-8000-00000000000e'::uuid, 1),  -- blocked buddy eve
      ('00000000-0000-4000-8000-00000000000a'::uuid, 5)   -- owner alice
    ) as v(viewer, expected)
  loop
    select count(*) into got
      from public.get_river_entries(viewer, 100, 0, 'all') r
      where r.user_id = '00000000-0000-4000-8000-00000000000a';
    if got <> expected then
      raise exception 'FAIL: get_river_entries viewer % sees % alice entries, expected %',
        coalesce(viewer::text, 'anon'), got, expected;
    end if;
  end loop;
end $$;

\echo '[5b] keyset pagination walks the same rows as one big page, no dupes/gaps'
do $$
declare
  expected uuid[]; walked uuid[] := '{}';
  cur_ts timestamptz := null; cur_id uuid := null;
  r record; n int;
begin
  select array_agg(id) into expected from (
    select id from public.get_river_entries(
      '00000000-0000-4000-8000-00000000000a', 100, 0, 'all')
  ) s;
  loop
    n := 0;
    for r in
      select * from public.get_river_entries(
        '00000000-0000-4000-8000-00000000000a', 2, 0, 'all', cur_ts, cur_id)
    loop
      walked := walked || r.id; cur_ts := r.sort_at; cur_id := r.id; n := n + 1;
    end loop;
    exit when n = 0;
  end loop;
  if walked is distinct from expected then
    raise exception 'FAIL: keyset walk % != single page %', walked, expected;
  end if;
end $$;

-- ===========================================================================
-- 6. Geo-pins inherit the entry visibility ladder (they are entry columns,
--    so this is row-level inheritance — but assert it explicitly so a future
--    refactor that moves pins elsewhere cannot silently break the promise)
-- ===========================================================================

\echo '[6a] stranger (frank) sees zero pinned rows (pin rides the close_friend entry)'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a' and latitude is not null;
  if n <> 0 then
    raise exception 'FAIL: stranger can see % pinned entries of alice, expected 0', n;
  end if;
end $$;
reset role;

\echo '[6b] blocked buddy (eve) sees zero pinned rows'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.xcrol_entries
    where user_id = '00000000-0000-4000-8000-00000000000a' and latitude is not null;
  if n <> 0 then
    raise exception 'FAIL: blocked user can see % pinned entries of alice, expected 0', n;
  end if;
end $$;
reset role;

\echo '[6c] get_river_entries returns pin columns to an authorized viewer (dave)'
do $$
declare r record; n int := 0;
begin
  for r in
    select * from public.get_river_entries(
      '00000000-0000-4000-8000-00000000000d', 100, 0, 'all')
    where user_id = '00000000-0000-4000-8000-00000000000a'
      and privacy_level = 'close_friend'
  loop
    n := n + 1;
    if r.latitude is null or r.longitude is null or r.location_label is distinct from 'Otaru' then
      raise exception 'FAIL: river pin columns wrong for close friend: lat=%, lng=%, label=%',
        r.latitude, r.longitude, r.location_label;
    end if;
  end loop;
  if n <> 1 then
    raise exception 'FAIL: close friend sees % close_friend river rows, expected 1', n;
  end if;
end $$;

\echo '[6d] get_river_entries returns no pinned rows to the stranger'
do $$
declare n int;
begin
  select count(*) into n
    from public.get_river_entries('00000000-0000-4000-8000-00000000000f', 100, 0, 'all') r
    where r.user_id = '00000000-0000-4000-8000-00000000000a' and r.latitude is not null;
  if n <> 0 then
    raise exception 'FAIL: get_river_entries leaks % pinned rows to a stranger', n;
  end if;
end $$;

-- ===========================================================================
-- 7. Relationship-ladder API primitives (oauth-relationship edge function)
--    The edge fn masks secret designations in TS; these assert the SQL layer
--    it builds on: the scope row, get_friendship_level, and the block signal.
-- ===========================================================================

\echo '[7a] relationship:read scope row exists'
do $$
declare n int;
begin
  select count(*) into n from public.oauth_scopes where id = 'relationship:read';
  if n <> 1 then
    raise exception 'FAIL: relationship:read scope row missing from oauth_scopes';
  end if;
end $$;

\echo '[7b] get_friendship_level returns the rung alice granted each viewer'
do $$
begin
  if public.get_friendship_level('00000000-0000-4000-8000-00000000000b', '00000000-0000-4000-8000-00000000000a') is distinct from 'buddy' then
    raise exception 'FAIL: bob''s rung from alice should be buddy';
  end if;
  if public.get_friendship_level('00000000-0000-4000-8000-00000000000c', '00000000-0000-4000-8000-00000000000a') is distinct from 'secret_friend' then
    raise exception 'FAIL: carol''s raw rung from alice should be secret_friend (edge fn masks to close_friend)';
  end if;
  if public.get_friendship_level('00000000-0000-4000-8000-00000000000d', '00000000-0000-4000-8000-00000000000a') is distinct from 'close_friend' then
    raise exception 'FAIL: dave''s rung from alice should be close_friend';
  end if;
  if public.get_friendship_level('00000000-0000-4000-8000-00000000000f', '00000000-0000-4000-8000-00000000000a') is not null then
    raise exception 'FAIL: stranger frank should have no rung from alice';
  end if;
end $$;

\echo '[7c] is_blocked reports alice''s block of eve (edge fn nulls the level on this signal)'
do $$
begin
  if not public.is_blocked('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000e') then
    raise exception 'FAIL: is_blocked(alice, eve) should be true';
  end if;
end $$;

-- ===========================================================================
-- 8. get_visible_friends / get_constellation ignore the client's viewer_id
--    (migration 20260818110000). Before it, viewer_id=profile_id from anon
--    returned the secret rows.
-- ===========================================================================

\echo '[8a] anon with SPOOFED viewer_id=profile_id gets no secret rows and no owner view'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int; secret int;
begin
  select count(*), count(*) filter (where level in ('secret_friend','secret_enemy','fake_friend'))
    into n, secret
    from public.get_visible_friends('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000a');
  if secret <> 0 then
    raise exception 'FAIL: spoofed viewer_id leaked % secret friendship(s) to anon', secret;
  end if;
  if n <> 3 then
    raise exception 'FAIL: anon sees % of alice''s friendships via RPC, expected 3', n;
  end if;
end $$;
reset role;

\echo '[8b] owner (alice) still sees her secret friendship through the RPC'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.get_visible_friends('00000000-0000-4000-8000-00000000000a', null) where level = 'secret_friend';
  if n <> 1 then
    raise exception 'FAIL: owner should see her 1 secret friendship, saw %', n;
  end if;
end $$;
reset role;

\echo '[8c] blocked viewer (eve) gets an EMPTY friend list for alice'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000e","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.get_visible_friends('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000a');
  if n <> 0 then
    raise exception 'FAIL: blocked eve sees % of alice''s friends, expected 0', n;
  end if;
  select count(*) into n from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n <> 0 then
    raise exception 'FAIL: blocked eve sees % constellation rows, expected 0', n;
  end if;
end $$;
reset role;

\echo '[8d] constellation: anon gets anonymous dots (no ids/names), never the secret friend'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int; n_named int; ids int; secret int;
begin
  select count(*), count(*) filter (where named), count(friend_id) + count(display_name) + count(id),
         count(*) filter (where level = 'secret_friend')
    into n, n_named, ids, secret
    from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n <> 3 or n_named <> 0 or ids <> 0 or secret <> 0 then
    raise exception 'FAIL: anon constellation rows=% named=% ids=% secret=% (expected 3/0/0/0)', n, n_named, ids, secret;
  end if;
end $$;
reset role;

\echo '[8e] constellation: threshold is applied server-side (close_friend sees names once alice opts in)'
update public.profiles set constellation_visibility = 'close_friend' where id = '00000000-0000-4000-8000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);
do $$
declare n_named int; n int;
begin
  select count(*), count(*) filter (where named and friend_id is not null) into n, n_named from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n <> 3 or n_named <> 3 then
    raise exception 'FAIL: close friend dave should see 3 named rows, got n=% named=%', n, n_named;
  end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare n_named int;
begin
  select count(*) filter (where named) into n_named from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n_named <> 0 then
    raise exception 'FAIL: stranger frank should not get names at close_friend threshold';
  end if;
end $$;
reset role;

\echo '[8f] constellation: hidden returns nothing to non-owners, everything to the owner'
update public.profiles set constellation_visibility = 'hidden' where id = '00000000-0000-4000-8000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000d","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n <> 0 then
    raise exception 'FAIL: hidden constellation returned % rows to a friend', n;
  end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.get_constellation('00000000-0000-4000-8000-00000000000a') where named and friend_id is not null;
  if n <> 4 then
    raise exception 'FAIL: owner should see all 4 (incl. secret friend) named, got %', n;
  end if;
end $$;
reset role;

-- ===========================================================================
-- 9. friendships RLS tighten (migration 20260819100000): the FRIEND side of an
--    edge can no longer read the concealed tier; anon can't read the table;
--    the owner still sees everything they set; get_my_level_from masks.
-- ===========================================================================

\echo '[9a] alice (the friend) cannot see that frank marked her secret_enemy'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare secret_in int; visible_in int;
begin
  select count(*) into secret_in from public.friendships
    where friend_id = '00000000-0000-4000-8000-00000000000a' and level in ('secret_friend','secret_enemy','fake_friend');
  if secret_in <> 0 then
    raise exception 'FAIL: alice can read % concealed edge(s) pointed at her', secret_in;
  end if;
  select count(*) into visible_in from public.friendships where friend_id = '00000000-0000-4000-8000-00000000000a';
  if visible_in < 1 then
    raise exception 'FAIL: alice should still see her visible incoming edges (bob buddy), saw %', visible_in;
  end if;
end $$;
reset role;

\echo '[9b] get_my_level_from masks: frank''s secret_enemy of alice reads as null to alice; bob''s buddy reads as buddy'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
begin
  if public.get_my_level_from('00000000-0000-4000-8000-00000000000f') is not null then
    raise exception 'FAIL: secret_enemy from frank should mask to null for alice';
  end if;
  if public.get_my_level_from('00000000-0000-4000-8000-00000000000b') is distinct from 'buddy' then
    raise exception 'FAIL: bob''s buddy rung should read as buddy';
  end if;
  -- carol marked alice? no; alice marked carol secret_friend (outgoing). get_my_level_from is the INCOMING direction, so alice->carol does not appear here.
end $$;
reset role;

\echo '[9c] the owner still sees the concealed tiers they set (outgoing)'
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare own_secret int;
begin
  select count(*) into own_secret from public.friendships
    where user_id = '00000000-0000-4000-8000-00000000000a' and level = 'secret_friend';   -- alice->carol
  if own_secret <> 1 then
    raise exception 'FAIL: owner alice should see the 1 secret_friend she set, saw %', own_secret;
  end if;
end $$;
reset role;

\echo '[9d] anon cannot read the friendships table at all'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.friendships;
  if n <> 0 then
    raise exception 'FAIL: anon can read % friendship rows (expected 0; use get_constellation)', n;
  end if;
end $$;
reset role;

\echo '[9e] get_constellation still serves anon (SECURITY DEFINER, unaffected by the anon policy change)'
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.get_constellation('00000000-0000-4000-8000-00000000000a');
  if n < 1 then
    raise exception 'FAIL: anon get_constellation returned no rows for alice';
  end if;
end $$;
reset role;

rollback;

\echo ''
\echo 'ALL RLS VISIBILITY TESTS PASSED'
