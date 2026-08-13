-- relationship:read OAuth scope — the "ladder as API".
--
-- Lets a connected app ("Login with Xcrol" satellite) ask what relationship
-- level another user has granted the token's user, so satellites can
-- friend-gate their own content without owning a social graph. The
-- oauth-relationship edge function does the token/scope checks and masks
-- secret designations; see supabase/functions/oauth-relationship/index.ts.
INSERT INTO public.oauth_scopes (id, name, description, category) VALUES
  ('relationship:read', 'Relationship Level', 'Check the relationship level other users have granted you', 'social')
ON CONFLICT (id) DO NOTHING;
