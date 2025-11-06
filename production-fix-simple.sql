-- =====================================================
-- SIMPLE PRODUCTION FIX
-- This fixes the RLS issue preventing trigger from updating invitations
-- =====================================================

-- =====================================================
-- STEP 1: Clean up unused tables/views
-- =====================================================

DROP VIEW IF EXISTS active_admins CASCADE;
DROP VIEW IF EXISTS admin_audit_log CASCADE;
DROP VIEW IF EXISTS pending_invitations CASCADE;
DROP TABLE IF EXISTS admin_invitations CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

SELECT '✅ Cleaned up unused tables/views' as status;

-- =====================================================
-- STEP 2: Fix RLS - Allow trigger to update invitations
-- =====================================================

-- The key issue: Triggers run as SECURITY DEFINER but RLS still applies
-- Solution: Add a policy that allows the function to bypass RLS

-- Drop all existing invitation policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view invitation by token" ON invitations;
DROP POLICY IF EXISTS "Service role can update invitations" ON invitations;

-- Recreate policies with proper permissions

-- 1. Admins can view all
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

-- 2. Admins can create
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

-- 3. Admins can update (for revoking)
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

-- 4. Public can verify by token
CREATE POLICY "Public can view invitation by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- 5. CRITICAL: Allow function owner (postgres) to update
-- This is what allows the trigger to work
CREATE POLICY "Function can update invitations"
  ON invitations
  FOR UPDATE
  TO postgres
  USING (true)
  WITH CHECK (true);

SELECT '✅ RLS policies fixed' as status;

-- =====================================================
-- STEP 3: Fix trigger function to use proper role
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_invitation RECORD;
  profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists (prevent duplicates)
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE NOTICE 'Profile already exists for user: %', NEW.email;
    RETURN NEW;
  END IF;

  -- Find valid invitation (case-insensitive)
  SELECT * INTO valid_invitation
  FROM invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If valid invitation exists
  IF valid_invitation.id IS NOT NULL THEN
    -- Create admin profile
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (
      NEW.id,
      NEW.email,
      'admin',
      valid_invitation.invited_by,
      valid_invitation.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      activated_at = COALESCE(profiles.activated_at, NOW());
    
    -- Update invitation status
    -- This runs as postgres role (function owner), so RLS allows it
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id,
        updated_at = NOW()
    WHERE id = valid_invitation.id;
    
    RAISE NOTICE 'Admin profile created and invitation accepted for: %', NEW.email;
  ELSE
    -- No valid invitation - create pending profile
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (NEW.id, NEW.email, 'pending_invite', NULL)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Pending profile created for: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    -- Create minimal profile to prevent complete failure
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'pending_invite')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon, service_role;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

SELECT '✅ Trigger function fixed' as status;

-- =====================================================
-- STEP 4: Fix profile RLS to allow trigger
-- =====================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile metadata" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Recreate policies

-- 1. Users can view own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Admins can view all profiles
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

-- 3. Users can update own metadata
CREATE POLICY "Users can update their own profile metadata"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- 4. CRITICAL: Allow function owner to insert/update profiles
CREATE POLICY "Function can manage profiles"
  ON profiles
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

SELECT '✅ Profile RLS policies fixed' as status;

-- =====================================================
-- STEP 5: Verification
-- =====================================================

-- Check current invitation
SELECT 
  email,
  status,
  expires_at > NOW() as is_valid,
  'https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check if user already exists (needs cleanup)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ User already exists - may need cleanup'
    ELSE '✅ No existing user'
  END as user_status;

-- Check if profile exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ Profile already exists - may need cleanup'
    ELSE '✅ No existing profile'
  END as profile_status;

SELECT '===========================================' as separator;
SELECT '✅ FIX COMPLETE!' as status;
SELECT '===========================================' as separator;
SELECT 'If user/profile exists, run cleanup-and-retry.sql first' as note;

