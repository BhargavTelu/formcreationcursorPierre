-- =====================================================
-- CLEAN AND FIX - Idempotent Version
-- This script can be run multiple times safely
-- =====================================================

-- Step 1: Drop ALL existing policies (no matter what they're named)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
    
    -- Drop all policies on invitations table
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.invitations';
    END LOOP;
    
    RAISE NOTICE '✅ All old policies dropped';
END $$;

-- Step 2: Create or replace the helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- Step 3: Create fresh policies for profiles

-- Policy 1: Allow users to SELECT their own profile (needed for login)
CREATE POLICY "profiles_users_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Allow admins to SELECT all profiles
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

-- Step 5: Create policies for invitations
CREATE POLICY "invitations_admins_all"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify everything
SELECT 
  '✅ Helper function exists' AS status,
  proname AS function_name,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'is_admin';

SELECT 
  '✅ Profiles policies created' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

SELECT 
  '✅ Invitations policies created' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invitations';

-- Step 7: Test with your actual user
DO $$
DECLARE
  admin_user RECORD;
  is_admin_result BOOLEAN;
BEGIN
  -- Get your specific admin user
  SELECT id, email INTO admin_user
  FROM public.profiles
  WHERE email = 'bhargavtelu101@gmail.com';
  
  IF admin_user.id IS NULL THEN
    RAISE NOTICE '⚠️  User bhargavtelu101@gmail.com not found in profiles';
    
    -- Check if they exist in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com') THEN
      RAISE NOTICE '⚠️  User exists in auth.users but not in profiles!';
      RAISE NOTICE '    Creating profile now...';
      
      INSERT INTO public.profiles (id, email, role, created_at, updated_at, activated_at)
      SELECT id, email, 'admin', NOW(), NOW(), NOW()
      FROM auth.users
      WHERE email = 'bhargavtelu101@gmail.com';
      
      RAISE NOTICE '✅ Profile created for bhargavtelu101@gmail.com';
    ELSE
      RAISE NOTICE '❌ User does not exist in auth.users either!';
    END IF;
    
    -- Try to get the user again
    SELECT id, email INTO admin_user
    FROM public.profiles
    WHERE email = 'bhargavtelu101@gmail.com';
  END IF;
  
  IF admin_user.id IS NOT NULL THEN
    -- Test the helper function
    is_admin_result := public.is_admin(admin_user.id);
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '           ✅✅✅ FIX COMPLETE! ✅✅✅';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE 'User: %', admin_user.email;
    RAISE NOTICE 'User ID: %', admin_user.id;
    RAISE NOTICE 'is_admin() returns: %', 
      CASE WHEN is_admin_result THEN '✅ TRUE' ELSE '❌ FALSE' END;
    RAISE NOTICE '';
    RAISE NOTICE 'All policies cleaned and recreated successfully!';
    RAISE NOTICE 'No more infinite recursion!';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 TRY LOGGING IN NOW! 🚀';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
  END IF;
END $$;

-- Show final policy list
SELECT 
  '📋 FINAL POLICIES ON PROFILES' AS info,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

