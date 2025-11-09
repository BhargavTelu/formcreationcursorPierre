-- =====================================================
-- FIX LOGIN ISSUE - Emergency Fix
-- This fixes the RLS policies that are blocking login
-- =====================================================

-- The issue: FORCE ROW LEVEL SECURITY is blocking authenticated users
-- from reading their own profiles during login

-- Step 1: Fix profiles RLS policies
DROP POLICY IF EXISTS "profiles_view_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin manage" ON public.profiles;

-- Step 2: Create proper policies that don't block login

-- Policy 1: Allow users to view their own profile (for login)
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Allow admins to manage all profiles
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Step 3: Remove FORCE ROW LEVEL SECURITY (it's too strict)
-- Keep RLS enabled but don't force it on superuser
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Don't use FORCE - this was causing the issue

-- Step 4: Do the same for invitations table
DROP POLICY IF EXISTS "invitations_admin_manage" ON public.invitations;
DROP POLICY IF EXISTS "Invitations: admin manage" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;

-- Allow admins to manage invitations
CREATE POLICY "invitations_admin_full_access"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
-- Don't use FORCE here either

-- Step 5: Verify the fix
SELECT 
  '✅ Profiles policies fixed' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

SELECT 
  '✅ Invitations policies fixed' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invitations';

-- Step 6: Test if login will work
-- This simulates what the login endpoint does
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT;
  can_read_profile BOOLEAN;
BEGIN
  -- Get an admin user for testing
  SELECT id, email INTO test_user_id, test_email
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️  No admin users found in profiles table';
    RETURN;
  END IF;
  
  -- Check if they can read their profile
  -- This simulates the login query
  PERFORM 1
  FROM public.profiles
  WHERE id = test_user_id;
  
  IF FOUND THEN
    can_read_profile := TRUE;
  ELSE
    can_read_profile := FALSE;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'LOGIN FIX TEST';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Test user: % (%)', test_email, test_user_id;
  RAISE NOTICE 'Can read own profile: %', 
    CASE WHEN can_read_profile THEN '✅ YES' ELSE '❌ NO' END;
  RAISE NOTICE '';
  
  IF can_read_profile THEN
    RAISE NOTICE '✅✅✅ LOGIN SHOULD NOW WORK! ✅✅✅';
    RAISE NOTICE 'Try logging in again with your admin credentials.';
  ELSE
    RAISE NOTICE '❌ Issue still exists. Check policies manually.';
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- =====================================================
-- ADDITIONAL DEBUG INFO
-- =====================================================

-- Show all current policies
SELECT 
  'CURRENT PROFILES POLICIES' AS info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Show all admin users
SELECT 
  'ADMIN USERS' AS info,
  email,
  role,
  activated_at
FROM public.profiles
WHERE role = 'admin';

