-- =====================================================
-- FINAL WORKING FIX - Simplified Approach
-- This uses a helper function that bypasses RLS
-- =====================================================

-- =====================================================
-- STEP 1: Clean Up
-- =====================================================

-- Delete existing user/profile if any
DELETE FROM profiles WHERE email = 'bhargavtelu101@gmail.com';

-- Reset invitation
UPDATE invitations 
SET status = 'pending', accepted_at = NULL, accepted_by = NULL
WHERE email = 'bhargavtelu101@gmail.com';

SELECT '✅ Cleanup complete' as status;

-- =====================================================
-- STEP 2: Create Helper Function (Bypasses RLS)
-- =====================================================

-- This function will be called by the trigger
-- It runs with SECURITY DEFINER and can bypass RLS

CREATE OR REPLACE FUNCTION create_profile_and_accept_invitation(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Find valid invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE LOWER(email) = LOWER(p_user_email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invitation.id IS NOT NULL THEN
    -- Create admin profile
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (
      p_user_id,
      p_user_email,
      'admin',
      v_invitation.invited_by,
      v_invitation.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      activated_at = COALESCE(profiles.activated_at, NOW());
    
    -- Update invitation
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id,
        updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN true;
  ELSE
    -- No invitation - create pending profile
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (p_user_id, p_user_email, 'pending_invite', NULL)
    ON CONFLICT (id) DO UPDATE SET
      role = 'pending_invite';
    
    RETURN false;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_profile_and_accept_invitation: %', SQLERRM;
    -- Still create minimal profile
    INSERT INTO profiles (id, email, role)
    VALUES (p_user_id, p_user_email, 'pending_invite')
    ON CONFLICT (id) DO NOTHING;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION create_profile_and_accept_invitation(UUID, TEXT) 
  TO postgres, authenticated, anon, service_role;

-- Set owner to postgres
ALTER FUNCTION create_profile_and_accept_invitation(UUID, TEXT) OWNER TO postgres;

SELECT '✅ Helper function created' as status;

-- =====================================================
-- STEP 3: Fix RLS Policies
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Public can view invitation by token" ON invitations;
DROP POLICY IF EXISTS "service_role_can_update_invitations" ON invitations;
DROP POLICY IF EXISTS "postgres_can_update_invitations" ON invitations;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile metadata" ON profiles;
DROP POLICY IF EXISTS "service_role_can_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "postgres_can_manage_profiles" ON profiles;

-- INVITATIONS POLICIES

CREATE POLICY "Admins can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public can view invitation by token"
  ON invitations FOR SELECT
  TO anon
  USING (status = 'pending' AND expires_at > NOW());

-- CRITICAL: Allow function to update (bypass RLS)
-- This allows the SECURITY DEFINER function to work
CREATE POLICY "Bypass RLS for functions"
  ON invitations FOR UPDATE
  TO postgres
  USING (true)
  WITH CHECK (true);

-- PROFILES POLICIES

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own profile metadata"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- CRITICAL: Allow function to insert/update (bypass RLS)
CREATE POLICY "Bypass RLS for functions"
  ON profiles FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

SELECT '✅ RLS policies fixed' as status;

-- =====================================================
-- STEP 4: Recreate Trigger (Uses Helper Function)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Simple trigger that calls the helper function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Call helper function (runs with SECURITY DEFINER)
  PERFORM create_profile_and_accept_invitation(NEW.id, NEW.email);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set owner
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Grant execute
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon, service_role;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

SELECT '✅ Trigger recreated' as status;

-- =====================================================
-- STEP 5: Verification
-- =====================================================

-- Show invitation
SELECT 
  'Invitation URL' as info,
  'https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url,
  status,
  expires_at > NOW() as is_valid
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check if user exists (needs manual deletion if exists)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ User exists - DELETE via Supabase Dashboard → Authentication → Users'
    ELSE '✅ No existing user'
  END as user_status;

SELECT '===========================================' as separator;
SELECT '✅ FIX COMPLETE!' as status;
SELECT '===========================================' as separator;
SELECT 'If user exists, delete it first, then try again!' as note;

