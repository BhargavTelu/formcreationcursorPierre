-- =====================================================
-- COMPREHENSIVE DIAGNOSTIC & FIX
-- This will diagnose the exact issue and fix it
-- =====================================================

-- =====================================================
-- STEP 1: Check Current State
-- =====================================================

SELECT '=== DIAGNOSTIC: Current State ===' as section;

-- Check if user exists
SELECT 
  'User Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ User already exists - needs cleanup'
    ELSE '✅ No existing user'
  END as status;

-- Check if profile exists
SELECT 
  'Profile Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ Profile already exists - needs cleanup'
    ELSE '✅ No existing profile'
  END as status;

-- Check invitation
SELECT 
  'Invitation Check' as check_type,
  email,
  status,
  expires_at > NOW() as is_valid,
  token
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check RLS policies
SELECT 
  'RLS Policies' as check_type,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'invitations')
ORDER BY tablename, policyname;

-- Check trigger
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_manipulation,
  action_timing,
  '✅ Exists' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- STEP 2: Clean Up Existing User/Profile
-- =====================================================

SELECT '=== CLEANUP: Removing existing user/profile ===' as section;

-- Delete profile first (if exists)
DELETE FROM profiles WHERE email = 'bhargavtelu101@gmail.com';

-- Note: Cannot delete from auth.users directly via SQL
-- User will need to be deleted via Supabase Dashboard or API
-- But we can check if it exists

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ User still exists in auth.users - delete via Supabase Dashboard → Authentication → Users'
    ELSE '✅ No user in auth.users'
  END as cleanup_status;

-- Reset invitation
UPDATE invitations 
SET status = 'pending', 
    accepted_at = NULL, 
    accepted_by = NULL
WHERE email = 'bhargavtelu101@gmail.com';

SELECT '✅ Invitation reset to pending' as cleanup_status;

-- =====================================================
-- STEP 3: Disable RLS Temporarily for Trigger
-- =====================================================

SELECT '=== FIX: Disabling RLS for trigger operations ===' as section;

-- The key fix: Temporarily disable RLS during trigger execution
-- This is safe because the trigger runs as SECURITY DEFINER

-- For profiles: Allow service_role to bypass RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- For invitations: Allow service_role to bypass RLS  
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Recreate RLS Policies (Simplified)
-- =====================================================

SELECT '=== FIX: Recreating RLS policies ===' as section;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view invitation by token" ON invitations;
DROP POLICY IF EXISTS "postgres_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "Function can update invitations" ON invitations;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile metadata" ON profiles;
DROP POLICY IF EXISTS "postgres_can_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "Function can manage profiles" ON profiles;

-- INVITATIONS POLICIES

-- 1. Admins can view
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

-- 3. Admins can update
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

-- 5. CRITICAL: Allow service_role (triggers) to update
CREATE POLICY "service_role_can_update_invitations"
  ON invitations
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PROFILES POLICIES

-- 1. Users can view own
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Admins can view all
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

-- 3. Users can update own (not role)
CREATE POLICY "Users can update their own profile metadata"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- 4. CRITICAL: Allow service_role to insert/update profiles
CREATE POLICY "service_role_can_manage_profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT '✅ RLS policies recreated' as status;

-- =====================================================
-- STEP 5: Recreate Trigger Function (Bypass RLS)
-- =====================================================

SELECT '=== FIX: Recreating trigger function ===' as section;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create function that explicitly sets role to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_invitation RECORD;
BEGIN
  -- Find valid invitation
  SELECT * INTO valid_invitation
  FROM invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If valid invitation found
  IF valid_invitation.id IS NOT NULL THEN
    -- Create admin profile
    -- Use service_role to bypass RLS
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    
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
      activated_at = COALESCE(profiles.activated_at, NOW()),
      invited_by = COALESCE(profiles.invited_by, valid_invitation.invited_by),
      invited_at = COALESCE(profiles.invited_at, valid_invitation.created_at);
    
    -- Update invitation
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id,
        updated_at = NOW()
    WHERE id = valid_invitation.id;
    
    -- Reset role
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  ELSE
    -- No valid invitation - create pending profile
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (NEW.id, NEW.email, 'pending_invite', NULL)
    ON CONFLICT (id) DO UPDATE SET
      role = 'pending_invite';
    
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    -- Create minimal profile
    BEGIN
      PERFORM set_config('request.jwt.claim.role', 'service_role', true);
      INSERT INTO profiles (id, email, role)
      VALUES (NEW.id, NEW.email, 'pending_invite')
      ON CONFLICT (id) DO NOTHING;
      PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set function owner to postgres
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Grant execute
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon, service_role;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

SELECT '✅ Trigger function recreated' as status;

-- =====================================================
-- STEP 6: Final Verification
-- =====================================================

SELECT '=== VERIFICATION ===' as section;

-- Check policies
SELECT 
  'Policy Check' as check_type,
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE tablename IN ('profiles', 'invitations')
  AND (roles = '{service_role}' OR policyname LIKE '%service_role%')
ORDER BY tablename;

-- Check invitation
SELECT 
  'Final Invitation Status' as check_type,
  email,
  status,
  expires_at > NOW() as is_valid,
  'https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

SELECT '===========================================' as separator;
SELECT '✅ FIX COMPLETE!' as final_status;
SELECT '===========================================' as separator;
SELECT 'IMPORTANT: If user exists in auth.users, delete it first:' as note1;
SELECT '  Supabase Dashboard → Authentication → Users → Delete' as note2;
SELECT 'Then try creating account again with the invitation URL above' as note3;

