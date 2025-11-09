-- =====================================================
-- DIAGNOSE LOGIN ISSUE
-- Run this to see exactly what's wrong with login
-- =====================================================

-- Step 1: Check if admin users exist in auth.users
SELECT 
  '1. USERS IN AUTH.USERS' AS check_name,
  id,
  email,
  email_confirmed_at IS NOT NULL AS email_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check if profiles exist for these users
SELECT 
  '2. PROFILES IN PUBLIC.PROFILES' AS check_name,
  p.id,
  p.email,
  p.role,
  p.activated_at,
  u.email AS auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 3: Find users WITHOUT profiles (this is a problem!)
SELECT 
  '3. USERS WITHOUT PROFILES (PROBLEM!)' AS check_name,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Step 4: Check RLS policies on profiles
SELECT 
  '4. RLS POLICIES ON PROFILES' AS check_name,
  policyname,
  cmd AS command,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Step 5: Check if RLS is using FORCE
SELECT 
  '5. RLS CONFIGURATION' AS check_name,
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN relforcerowsecurity THEN '⚠️ FORCE ENABLED (may block login)'
    ELSE '✅ Normal RLS'
  END AS rls_mode
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'invitations');

-- Step 6: Test profile access for each admin user
DO $$
DECLARE
  user_record RECORD;
  profile_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '6. TESTING PROFILE ACCESS FOR EACH USER';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    ORDER BY u.created_at DESC
    LIMIT 5
  LOOP
    -- Check if profile exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = user_record.id
    ) INTO profile_exists;
    
    IF profile_exists THEN
      RAISE NOTICE '✅ %: HAS PROFILE', user_record.email;
    ELSE
      RAISE NOTICE '❌ %: NO PROFILE (LOGIN WILL FAIL!)', user_record.email;
    END IF;
  END LOOP;
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- Step 7: Summary and recommendations
DO $$
DECLARE
  users_without_profiles INT;
  admin_count INT;
  force_rls_enabled BOOLEAN;
BEGIN
  -- Count users without profiles
  SELECT COUNT(*) INTO users_without_profiles
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;
  
  -- Count admin profiles
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role = 'admin';
  
  -- Check if FORCE RLS is enabled
  SELECT relforcerowsecurity INTO force_rls_enabled
  FROM pg_class
  WHERE relname = 'profiles';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSIS SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Admin profiles: %', admin_count;
  RAISE NOTICE 'Users without profiles: %', users_without_profiles;
  RAISE NOTICE 'Force RLS: %', CASE WHEN force_rls_enabled THEN 'YES ⚠️' ELSE 'NO ✅' END;
  RAISE NOTICE '';
  
  IF users_without_profiles > 0 THEN
    RAISE NOTICE '❌ PROBLEM: % users have no profile!', users_without_profiles;
    RAISE NOTICE 'FIX: The trigger should create profiles automatically.';
    RAISE NOTICE '     Check if on_auth_user_created trigger is working.';
    RAISE NOTICE '';
  END IF;
  
  IF force_rls_enabled THEN
    RAISE NOTICE '❌ PROBLEM: FORCE RLS is enabled on profiles table!';
    RAISE NOTICE 'FIX: Run FIX-LOGIN-ISSUE.sql to disable FORCE RLS.';
    RAISE NOTICE '     FORCE RLS blocks even legitimate queries.';
    RAISE NOTICE '';
  END IF;
  
  IF admin_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM: No admin profiles exist!';
    RAISE NOTICE 'FIX: Create an admin profile manually or use bootstrap.';
    RAISE NOTICE '';
  END IF;
  
  IF users_without_profiles = 0 AND NOT force_rls_enabled AND admin_count > 0 THEN
    RAISE NOTICE '✅ Database looks OK. Issue might be in the code or RLS policies.';
    RAISE NOTICE 'FIX: Run FIX-LOGIN-ISSUE.sql to update RLS policies.';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Run FIX-LOGIN-ISSUE.sql to fix RLS policies';
  RAISE NOTICE '2. If users have no profiles, check the trigger';
  RAISE NOTICE '3. Try logging in again';
  RAISE NOTICE '';
END $$;

