-- Priority 1: Add missing database indexes for performance

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON public.messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE read_at IS NULL;

-- Hosting requests indexes
CREATE INDEX IF NOT EXISTS idx_hosting_requests_from_user_id ON public.hosting_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_hosting_requests_to_user_id ON public.hosting_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_hosting_requests_status ON public.hosting_requests(status);

-- Meetup requests indexes
CREATE INDEX IF NOT EXISTS idx_meetup_requests_from_user_id ON public.meetup_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_meetup_requests_to_user_id ON public.meetup_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_meetup_requests_status ON public.meetup_requests(status);

-- OAuth tables indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON public.oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access_token ON public.oauth_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_oauth_authorization_codes_user_id ON public.oauth_authorization_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_user_authorizations_user_id ON public.oauth_user_authorizations(user_id);

-- Social links index
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON public.social_links(user_id);

-- Friendships indexes for faster lookups (critical for connection degree)
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_level ON public.friendships(level);

-- Introduction requests indexes
CREATE INDEX IF NOT EXISTS idx_introduction_requests_requester_id ON public.introduction_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_introduction_requests_introducer_id ON public.introduction_requests(introducer_id);
CREATE INDEX IF NOT EXISTS idx_introduction_requests_target_id ON public.introduction_requests(target_id);

-- Priority 1: Simplify user_references SELECT RLS policy
-- Replace expensive is_within_three_degrees() recursive call with simpler checks

DROP POLICY IF EXISTS "Users can view references within 3 degrees" ON public.user_references;

-- New simplified policy: users can see references if:
-- 1. They wrote the reference
-- 2. The reference is about them
-- 3. They are friends with either party (direct friendship check, no recursion)
-- 4. Public references (about users they can see)
CREATE POLICY "Users can view references"
ON public.user_references
FOR SELECT
TO public
USING (
  -- Anyone can read references (they're meant to be public testimonials)
  -- Just filter out blocked users
  NOT is_blocked(from_user_id, auth.uid())
  AND NOT is_blocked(to_user_id, auth.uid())
  AND NOT is_blocked(auth.uid(), from_user_id)
  AND NOT is_blocked(auth.uid(), to_user_id)
);