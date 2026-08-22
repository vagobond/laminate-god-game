-- Usernames live at the top-level route /:username; a username equal to a
-- static route's first segment (admin, powers, map, ...) would make that
-- profile unreachable — the static route always wins. Enforce the reserved
-- list at the DB so no signup/edit path can mint one. Verified 2026-08-22
-- that no existing row holds a reserved name. Hyphenated route segments are
-- omitted: the username charset (^[a-z0-9_]+$) already excludes hyphens.
-- Client mirror: src/lib/reserved-usernames.ts.

CREATE OR REPLACE FUNCTION public.is_reserved_username(name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(name) IN (
    'admin','auth','brook','developers','group','hearthsurf','host',
    'library','map','messages','myxcrol','oauth','post','powers',
    'privacy','profile','scrolls','settings','terms','u','xcrol',
    'embed','card','assets','api','functions','rest','storage',
    'welcome','home','login','logout','signup','search','about',
    'help','support','notifications'
  );
$$;

-- NOT VALID: skips the (verified clean) backfill scan; enforces new writes.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_not_reserved
  CHECK (username IS NULL OR NOT public.is_reserved_username(username))
  NOT VALID;

-- handle_new_user auto-generates usernames from display name / email local
-- part; without this, a signup as admin@example.com would generate the
-- reserved name 'admin', trip the constraint, and FAIL THE SIGNUP. Treat
-- reserved names exactly like collisions: suffix a counter.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
  display_name_value TEXT;
BEGIN
  -- Get display name from metadata, fallback to email prefix
  display_name_value := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));

  -- LOWERCASE FIRST, then remove special chars
  base_username := regexp_replace(lower(display_name_value), '[^a-z0-9]', '', 'g');

  -- Ensure it's at least 2 characters
  IF length(base_username) < 2 THEN
    base_username := base_username || 'user';
  END IF;

  -- Start with the base username
  final_username := base_username;

  -- Append a number while the candidate is taken OR reserved
  WHILE public.is_reserved_username(final_username)
     OR EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    new.id,
    new.email,
    display_name_value,
    final_username
  );
  RETURN new;
END;
$function$;
