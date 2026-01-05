-- Create table for registered OAuth client applications
CREATE TABLE public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  client_id text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logo_url text,
  homepage_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for OAuth scopes/permissions
CREATE TABLE public.oauth_scopes (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'basic'
);

-- Insert default scopes
INSERT INTO public.oauth_scopes (id, name, description, category) VALUES
  ('profile:read', 'Read Profile', 'Access your basic profile information (name, avatar, bio)', 'basic'),
  ('profile:email', 'Read Email', 'Access your email address', 'personal'),
  ('connections:read', 'Read Connections', 'See your friends and connection degrees', 'social'),
  ('connections:degree', 'Connection Degree', 'Check connection degree to other users', 'social'),
  ('xcrol:read', 'Read Xcrol Entries', 'Access your public Xcrol entries', 'content'),
  ('hometown:read', 'Read Hometown', 'Access your hometown location', 'personal');

-- Create table for authorization codes (short-lived)
CREATE TABLE public.oauth_authorization_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_id uuid REFERENCES public.oauth_clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redirect_uri text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for access/refresh tokens
CREATE TABLE public.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  refresh_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_id uuid REFERENCES public.oauth_clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  access_token_expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  refresh_token_expires_at timestamptz DEFAULT (now() + interval '30 days'),
  revoked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create table for user-granted authorizations (what apps a user has authorized)
CREATE TABLE public.oauth_user_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.oauth_clients(id) ON DELETE CASCADE NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Enable RLS on all tables
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_user_authorizations ENABLE ROW LEVEL SECURITY;

-- Scopes are readable by anyone
CREATE POLICY "Scopes are public" ON public.oauth_scopes FOR SELECT USING (true);

-- Client apps: owners can manage their own apps
CREATE POLICY "Owners can manage their apps" ON public.oauth_clients
  FOR ALL USING (auth.uid() = owner_id);

-- Anyone can read verified apps (for authorization screen)
CREATE POLICY "Anyone can read apps for authorization" ON public.oauth_clients
  FOR SELECT USING (true);

-- Authorization codes: only accessible by the user who created them
CREATE POLICY "Users can manage their auth codes" ON public.oauth_authorization_codes
  FOR ALL USING (auth.uid() = user_id);

-- Tokens: only accessible by the token owner
CREATE POLICY "Users can manage their tokens" ON public.oauth_tokens
  FOR ALL USING (auth.uid() = user_id);

-- User authorizations: users can see and revoke their own
CREATE POLICY "Users can manage their authorizations" ON public.oauth_user_authorizations
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_oauth_tokens_access ON public.oauth_tokens(access_token) WHERE NOT revoked;
CREATE INDEX idx_oauth_tokens_refresh ON public.oauth_tokens(refresh_token) WHERE NOT revoked;
CREATE INDEX idx_oauth_codes_code ON public.oauth_authorization_codes(code);
CREATE INDEX idx_oauth_clients_client_id ON public.oauth_clients(client_id);

-- Add updated_at trigger
CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON public.oauth_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oauth_user_authorizations_updated_at
  BEFORE UPDATE ON public.oauth_user_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();