-- Hash OAuth tokens at rest (assessment worklist item 1).
--
-- Before: oauth_tokens.access_token / refresh_token stored the plaintext
-- 64-char hex tokens, minted by column DEFAULTs. A database read compromise
-- (or a backup leak) yielded usable credentials for every connected app.
--
-- After: columns store sha256 hex digests only. Token generation moves to the
-- oauth-token edge function, which returns the plaintext to the client once
-- and stores only the hash. Lookups (oauth-token refresh grant,
-- oauth-userinfo, oauth-connection-degree) compare sha256(presented token).
--
-- Existing rows are hashed IN PLACE — never wiped. Consumers (w3wu.com,
-- microvictoryarmy.com, averygoodnovel.com, baoism.org) keep working: all
-- current rows are expired anyway, but hashing preserves row history and the
-- invariant that plaintext never needs to exist in the DB again.

-- Hash existing tokens in place. Values are opaque random hex, so a one-time
-- deterministic hash preserves uniqueness (unique indexes remain valid).
UPDATE public.oauth_tokens
SET access_token = encode(digest(access_token, 'sha256'), 'hex'),
    refresh_token = CASE
      WHEN refresh_token IS NOT NULL
      THEN encode(digest(refresh_token, 'sha256'), 'hex')
    END;

-- Token minting moves to the edge function; the DB must never again generate
-- (and thereby store) plaintext tokens.
ALTER TABLE public.oauth_tokens ALTER COLUMN access_token DROP DEFAULT;
ALTER TABLE public.oauth_tokens ALTER COLUMN refresh_token DROP DEFAULT;

COMMENT ON COLUMN public.oauth_tokens.access_token IS
  'sha256 hex digest of the access token; plaintext is never stored';
COMMENT ON COLUMN public.oauth_tokens.refresh_token IS
  'sha256 hex digest of the refresh token; plaintext is never stored';
