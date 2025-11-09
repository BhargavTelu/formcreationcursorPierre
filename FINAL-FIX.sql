-- =====================================================
-- FINAL FIX - Clean and Simple
-- This script fixes the infinite recursion issue
-- =====================================================

-- Step 1: Drop ALL existing policies automatically
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
    
    RAISE NOTICE '✅ Step 1: All old policies dropped';
END $$;

-- Step 2: Create helper function to avoid recursion
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;

-- Step 3: Create policies for profiles table

-- Allow users to view their own profile (needed for login)
CREATE POLICY "profiles_users_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "profiles_admins_select_all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow admins to insert profiles
CREATE POLICY "profiles_admins_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update profiles
CREATE POLICY "profiles_admins_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to delete profiles
CREATE POLICY "profiles_admins_delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable RLS on profiles (not FORCE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for invitations table
CREATE POLICY "invitations_admins_all"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify and test everything
DO $$
DECLARE
  admin_user RECORD;
  is_admin_result BOOLEAN;
  profile_count INT;
  policy_count INT;
BEGIN
  -- Check policies were created
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '              DATABASE FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Helper function: is_admin() created';
  RAISE NOTICE '✅ Profiles policies: % created', policy_count;
  RAISE NOTICE '✅ Invitations policies: created';
  RAISE NOTICE '✅ RLS enabled (not FORCE)';
  RAISE NOTICE '';
  
  -- Check if your user exists and test the function
  SELECT id, email INTO admin_user
  FROM public.profiles
  WHERE email = 'bhargavtelu101@gmail.com';
  
  IF admin_user.id IS NOT NULL THEN
    is_admin_result := public.is_admin(admin_user.id);
    
    RAISE NOTICE '👤 Your user: %', admin_user.email;
    RAISE NOTICE '🔑 User ID: %', admin_user.id;
    RAISE NOTICE '✅ is_admin() returns: %', 
      CASE WHEN is_admin_result THEN 'TRUE (correct!)' ELSE 'FALSE (check role)' END;
    RAISE NOTICE '';
    
    IF is_admin_result THEN
      RAISE NOTICE '╔═══════════════════════════════════════════════════╗';
      RAISE NOTICE '║                                                   ║';
      RAISE NOTICE '║       ✅✅✅ ALL FIXED! ✅✅✅                    ║';
      RAISE NOTICE '║                                                   ║';
      RAISE NOTICE '║   No more infinite recursion!                    ║';
      RAISE NOTICE '║   Login should work now!                         ║';
      RAISE NOTICE '║                                                   ║';
      RAISE NOTICE '║   🚀 GO TRY LOGGING IN! 🚀                       ║';
      RAISE NOTICE '║                                                   ║';
      RAISE NOTICE '╚═══════════════════════════════════════════════════╝';
    ELSE
      RAISE NOTICE '⚠️  User exists but is_admin() returned FALSE';
      RAISE NOTICE '    Check if role is set to "admin" in profiles table';
    END IF;
  ELSE
    -- User doesn't exist in profiles, check if they're in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com') THEN
      RAISE NOTICE '⚠️  User exists in auth.users but not in profiles table';
      RAISE NOTICE '    Creating profile now...';
      
      INSERT INTO public.profiles (id, email, role, created_at, updated_at, activated_at)
      SELECT id, email, 'admin', NOW(), NOW(), NOW()
      FROM auth.users
      WHERE email = 'bhargavtelu101@gmail.com';
      
      RAISE NOTICE '✅ Profile created for bhargavtelu101@gmail.com';
      RAISE NOTICE '';
      RAISE NOTICE '🚀 NOW TRY LOGGING IN! 🚀';
    ELSE
      RAISE NOTICE '⚠️  User bhargavtelu101@gmail.com not found';
      RAISE NOTICE '    User needs to be created in auth.users first';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- Show final policies for verification
SELECT 
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'invitations')
ORDER BY tablename, policyname;

