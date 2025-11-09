-- =============================================================
-- Agency Authentication System
-- Run this script in the Supabase SQL editor after agencies table exists
-- =============================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- Agency Users Table
-- Stores agency login credentials (separate from admin users)
-- =============================================================
CREATE TABLE IF NOT EXISTS agency_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL UNIQUE REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(agency_id, email)
);

CREATE INDEX IF NOT EXISTS idx_agency_users_agency_id ON agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_email ON agency_users(email);
CREATE INDEX IF NOT EXISTS idx_agency_users_active ON agency_users(is_active);

-- =============================================================
-- Agency Sessions Table
-- Stores active agency user sessions
-- =============================================================
CREATE TABLE IF NOT EXISTS agency_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_user_id UUID NOT NULL REFERENCES agency_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_sessions_user_id ON agency_sessions(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_agency_sessions_token_hash ON agency_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_agency_sessions_expires_at ON agency_sessions(expires_at);

-- =============================================================
-- Updated-at trigger for agency_users
-- =============================================================
DROP TRIGGER IF EXISTS trg_agency_users_updated_at ON agency_users;
CREATE TRIGGER trg_agency_users_updated_at
  BEFORE UPDATE ON agency_users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- Row Level Security (RLS) Policies
-- =============================================================

-- Enable RLS on agency_users
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agency users can view their own agency's users" ON agency_users;
DROP POLICY IF EXISTS "Admins can manage all agency users" ON agency_users;
DROP POLICY IF EXISTS "Service role can manage all agency users" ON agency_users;

DROP POLICY IF EXISTS "Agency users can view their own sessions" ON agency_sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON agency_sessions;

-- Policy: Agency users can view users from their own agency
CREATE POLICY "Agency users can view their own agency's users"
  ON agency_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_users au
      JOIN agency_sessions s ON s.agency_user_id = au.id
      WHERE au.agency_id = agency_users.agency_id
        AND s.token_hash = current_setting('request.jwt.claims', true)::json->>'session_token'
        AND s.expires_at > NOW()
        AND au.is_active = true
    )
    OR
    -- Allow service role (for API operations)
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Policy: Only service role can insert/update/delete agency users
CREATE POLICY "Service role can manage all agency users"
  ON agency_users
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Policy: Agency users can view their own sessions
CREATE POLICY "Agency users can view their own sessions"
  ON agency_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_sessions s
      WHERE s.id = agency_sessions.id
        AND s.token_hash = current_setting('request.jwt.claims', true)::json->>'session_token'
        AND s.expires_at > NOW()
    )
    OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Policy: Service role can manage all sessions
CREATE POLICY "Service role can manage all sessions"
  ON agency_sessions
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================================
-- Helper Functions
-- =============================================================

-- Function to clean up expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_agency_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM agency_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agency user with agency info
CREATE OR REPLACE FUNCTION get_agency_user_with_agency(p_user_email TEXT, p_agency_id UUID)
RETURNS TABLE (
  user_id UUID,
  agency_id UUID,
  email TEXT,
  name TEXT,
  is_active BOOLEAN,
  agency_name TEXT,
  agency_subdomain TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.agency_id,
    au.email,
    au.name,
    au.is_active,
    a.name as agency_name,
    a.subdomain as agency_subdomain
  FROM agency_users au
  JOIN agencies a ON a.id = au.agency_id
  WHERE au.email = LOWER(p_user_email)
    AND au.agency_id = p_agency_id
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- Comments
-- =============================================================
COMMENT ON TABLE agency_users IS 'Stores agency login credentials - one user per agency';
COMMENT ON TABLE agency_sessions IS 'Stores active agency user sessions';
COMMENT ON COLUMN agency_users.agency_id IS 'Unique constraint ensures only one user per agency';
COMMENT ON COLUMN agency_sessions.token_hash IS 'SHA-256 hash of the session token';

