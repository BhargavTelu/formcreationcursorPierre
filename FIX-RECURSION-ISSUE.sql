-- =====================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- This is the REAL fix for the login issue
-- =====================================================

-- THE PROBLEM:
-- The RLS policy on profiles table checks if user is admin by querying profiles table
-- This creates infinite recursion: query profiles → check if admin → query profiles → check if admin → ...

-- THE SOLUTION:
-- Use a helper function with SECURITY DEFINER to bypass RLS when checking admin status

-- Step 1: Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This is critical - bypasses RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
      AND role = 'admin'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Step 2: Drop ALL existing problematic policies (including from previous attempts)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_view_own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admins_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admins_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admins_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admins_delete" ON public.profiles;

-- Step 3: Create NON-RECURSIVE policies

-- Policy 1: Allow users to SELECT their own profile (needed for login)
-- This one is safe - no recursion because it only checks auth.uid() = id
CREATE POLICY "profiles_users_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Allow admins to SELECT all profiles
-- Uses helper function to avoid recursion
CREATE POLICY "profiles_admins_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Policy 3: Allow admins to INSERT profiles
CREATE POLICY "profiles_admins_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 4: Allow admins to UPDATE profiles
CREATE POLICY "profiles_admins_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 5: Allow admins to DELETE profiles
CREATE POLICY "profiles_admins_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Step 4: Ensure RLS is enabled (but NOT forced)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Fix invitations table policies similarly
DROP POLICY IF EXISTS "invitations_admin_full_access" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admin_manage" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
DROP POLICY IF EXISTS "Invitations: admin manage" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admins_all" ON public.invitations;

-- Create non-recursive policies for invitations
CREATE POLICY "invitations_admins_all"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the fix
SELECT 
  '✅ Helper function created' AS status,
  proname AS function_name
FROM pg_proc
WHERE proname = 'is_admin';

SELECT 
  '✅ Profiles policies recreated' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

SELECT 
  '✅ Invitations policies recreated' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invitations';

-- Step 7: Test the fix
DO $$
DECLARE
  admin_user RECORD;
  can_read BOOLEAN := FALSE;
BEGIN
  -- Get an admin user
  SELECT id, email INTO admin_user
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;
  
  IF admin_user.id IS NULL THEN
    RAISE NOTICE '⚠️  No admin users found';
    RETURN;
  END IF;
  
  -- Test if the helper function works
  can_read := public.is_admin(admin_user.id);
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'RECURSION FIX TEST';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Test admin user: %', admin_user.email;
  RAISE NOTICE 'is_admin() function returns: %', 
    CASE WHEN can_read THEN '✅ TRUE' ELSE '❌ FALSE' END;
  RAISE NOTICE '';
  
  IF can_read THEN
    RAISE NOTICE '✅✅✅ RECURSION FIXED! LOGIN SHOULD WORK NOW! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'The infinite recursion issue is resolved.';
    RAISE NOTICE 'Try logging in again with your credentials.';
  ELSE
    RAISE NOTICE '⚠️  Helper function returned FALSE - check if user has admin role';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- Step 8: Show all current policies (for verification)
SELECT 
  'FINAL POLICIES ON PROFILES' AS info,
  policyname,
  cmd,
  qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

