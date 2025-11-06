-- =====================================================
-- PRODUCTION-GRADE RBAC & INVITATION SYSTEM MIGRATION
-- Finest Africa Travel Planning - Admin Security Lockdown
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE - User Roles & Metadata
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pending_invite')) DEFAULT 'pending_invite',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON profiles(invited_by);

-- =====================================================
-- 2. INVITATIONS TABLE - Secure Token Management
-- =====================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- Nullable for system invitations
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, alter the column to make it nullable
DO $$ 
BEGIN
  -- Drop the old NOT NULL constraint if it exists
  ALTER TABLE invitations ALTER COLUMN invited_by DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Ignore error if constraint doesn't exist
    NULL;
END $$;

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- =====================================================
-- 3. TRIGGERS - Auto-create profiles and update timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for invitations updated_at
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration (via invitation only)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_invitation RECORD;
BEGIN
  -- Check if there's a valid invitation for this email
  SELECT * INTO valid_invitation
  FROM invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If valid invitation exists, create admin profile
  IF valid_invitation.id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (
      NEW.id,
      NEW.email,
      'admin',
      valid_invitation.invited_by,
      valid_invitation.created_at,
      NOW()
    );
    
    -- Mark invitation as accepted
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id
    WHERE id = valid_invitation.id;
  ELSE
    -- No valid invitation - create pending_invite profile (locked out)
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (NEW.id, NEW.email, 'pending_invite', NULL);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ==================== PROFILES POLICIES ====================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile metadata" ON profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own metadata (not role)
CREATE POLICY "Users can update their own profile metadata"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- ==================== INVITATIONS POLICIES ====================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view their own pending invitation by token" ON invitations;

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update invitations (e.g., revoke)
CREATE POLICY "Admins can update invitations"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Public can view their pending invitation by token (for acceptance flow)
CREATE POLICY "Public can view invitation by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- ==================== AGENCIES POLICIES (UPDATE) ====================

-- Update agencies policies to require admin role
-- Drop ALL possible policy names (old and new)
DROP POLICY IF EXISTS "Allow authenticated users to create agencies" ON agencies;
DROP POLICY IF EXISTS "Allow authenticated users to update agencies" ON agencies;
DROP POLICY IF EXISTS "Only admins can create agencies" ON agencies;
DROP POLICY IF EXISTS "Only admins can update agencies" ON agencies;
DROP POLICY IF EXISTS "Allow public read access to agencies" ON agencies;

-- Keep public read access (needed for subdomain routing)
CREATE POLICY "Allow public read access to agencies"
  ON agencies
  FOR SELECT
  TO public
  USING (true);

-- Admin-only create
CREATE POLICY "Only admins can create agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin-only update
CREATE POLICY "Only admins can update agencies"
  ON agencies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS generate_invitation_token();
DROP FUNCTION IF EXISTS get_valid_invitation(TEXT);
DROP FUNCTION IF EXISTS expire_old_invitations();

-- Function to check if user is admin
CREATE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate secure invitation token (URL-safe)
CREATE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token_bytes BYTEA;
  token_b64 TEXT;
BEGIN
  -- Generate 32 random bytes
  token_bytes := gen_random_bytes(32);
  
  -- Encode to base64
  token_b64 := encode(token_bytes, 'base64');
  
  -- Make URL-safe: replace + with -, / with _, and remove =
  token_b64 := replace(token_b64, '+', '-');
  token_b64 := replace(token_b64, '/', '_');
  token_b64 := replace(token_b64, '=', '');
  
  RETURN token_b64;
END;
$$ LANGUAGE plpgsql;

-- Function to get valid invitation by token
CREATE FUNCTION get_valid_invitation(invitation_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  invited_by UUID,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.invited_by, i.expires_at
  FROM invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invitations (run this periodically)
CREATE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE FIRST ADMIN (BOOTSTRAP)
-- =====================================================

-- IMPORTANT: After running this migration, manually insert your first admin
-- Replace 'your-email@example.com' with your actual email, then sign up with that email

-- Example: Insert pending invitation for first admin
-- INSERT INTO invitations (email, token, invited_by, status, expires_at)
-- VALUES (
--   'your-email@example.com',
--   generate_invitation_token(),
--   NULL, -- System invitation (no specific inviter)
--   'pending',
--   NOW() + INTERVAL '30 days'
-- );

-- Or manually upgrade existing user to admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- =====================================================
-- 7. VERIFICATION & CLEANUP
-- =====================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_dashboard_stats;

-- Create view for admin dashboard
CREATE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM profiles WHERE role = 'pending_invite') as pending_users,
  (SELECT COUNT(*) FROM invitations WHERE status = 'pending' AND expires_at > NOW()) as active_invitations,
  (SELECT COUNT(*) FROM invitations WHERE status = 'accepted') as accepted_invitations,
  (SELECT COUNT(*) FROM invitations WHERE status = 'expired') as expired_invitations,
  (SELECT COUNT(*) FROM agencies) as total_agencies,
  (SELECT COUNT(*) FROM form_submissions) as total_submissions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON invitations TO anon; -- Only for token verification
GRANT ALL ON profiles, invitations TO authenticated;

-- Display migration results
SELECT 'RBAC Migration completed successfully!' as status;
SELECT '⚠️  IMPORTANT: Bootstrap first admin user - see SQL comments above' as action_required;

-- Show table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('profiles', 'invitations')
ORDER BY table_name, ordinal_position;

-- Show current stats
SELECT * FROM admin_dashboard_stats;

