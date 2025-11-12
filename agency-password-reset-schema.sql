-- =============================================================
-- Agency Password Reset System
-- Run this script in the Supabase SQL Editor
-- This creates the password reset token system for agencies
-- =============================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- Agency Password Reset Tokens Table
-- Stores password reset tokens for agency users
-- =============================================================
CREATE TABLE IF NOT EXISTS agency_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_user_id UUID NOT NULL REFERENCES agency_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_agency_password_reset_tokens_user_id ON agency_password_reset_tokens(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_agency_password_reset_tokens_token_hash ON agency_password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_agency_password_reset_tokens_expires_at ON agency_password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_agency_password_reset_tokens_used_at ON agency_password_reset_tokens(used_at);

-- =============================================================
-- Row Level Security (RLS) Policies
-- =============================================================

-- Enable RLS on agency_password_reset_tokens
ALTER TABLE agency_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage all password reset tokens" ON agency_password_reset_tokens;

-- Policy: Only service role can manage password reset tokens
CREATE POLICY "Service role can manage all password reset tokens"
  ON agency_password_reset_tokens
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

-- Function to clean up expired and used tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_agency_password_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM agency_password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- Comments
-- =============================================================
COMMENT ON TABLE agency_password_reset_tokens IS 'Stores password reset tokens for agency users';
COMMENT ON COLUMN agency_password_reset_tokens.token_hash IS 'SHA-256 hash of the reset token';
COMMENT ON COLUMN agency_password_reset_tokens.expires_at IS 'Token expiration time (typically 1 hour)';
COMMENT ON COLUMN agency_password_reset_tokens.used_at IS 'Timestamp when token was used (null if unused)';


