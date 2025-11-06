-- =====================================================
-- RECREATE INVITATIONS TABLE (Alternative Solution)
-- ⚠️ WARNING: This will delete all existing invitations!
-- Only use if fix-invitations-table.sql doesn't work
-- =====================================================

-- Step 1: Backup existing invitations (if any)
CREATE TABLE IF NOT EXISTS invitations_backup AS 
SELECT * FROM invitations;

SELECT 'Backed up ' || COUNT(*) || ' existing invitations' as backup_status
FROM invitations_backup;

-- Step 2: Drop the invitations table completely
DROP TABLE IF EXISTS invitations CASCADE;

-- Step 3: Recreate with correct schema
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- ✅ NULLABLE
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_invited_by ON invitations(invited_by);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- Step 5: Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Step 6: Recreate RLS policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view invitation by token" ON invitations;

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

CREATE POLICY "Public can view invitation by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- Step 7: Recreate trigger
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Grant permissions
GRANT SELECT ON invitations TO anon;
GRANT ALL ON invitations TO authenticated;

-- Step 9: Verify
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

SELECT '✅ Invitations table recreated successfully!' as status;
SELECT 'invited_by column is now nullable - you can run bootstrap-first-admin.sql' as next_step;

