-- =====================================================
-- ADMIN INVITATION DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose issues
-- =====================================================

-- Check 1: Verify invitations table exists and has correct structure
SELECT 
  '1. INVITATIONS TABLE STRUCTURE' AS check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invitations'
ORDER BY ordinal_position;

-- Check 2: Verify profiles table exists and has correct structure
SELECT 
  '2. PROFILES TABLE STRUCTURE' AS check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: List all active invitations
SELECT 
  '3. ACTIVE INVITATIONS' AS check_name,
  id,
  email,
  status,
  invited_at,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN '⚠️ EXPIRED'
    WHEN status = 'pending' THEN '✅ VALID'
    ELSE '❌ ' || status
  END AS invitation_status
FROM public.invitations
ORDER BY created_at DESC;

-- Check 4: Check if trigger exists
SELECT 
  '4. DATABASE TRIGGERS' AS check_name,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users';

-- Check 5: Check if the handle_new_user function exists
SELECT 
  '5. TRIGGER FUNCTION' AS check_name,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Check 6: Verify RLS policies on invitations table
SELECT 
  '6. INVITATIONS RLS POLICIES' AS check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invitations';

-- Check 7: Verify RLS policies on profiles table
SELECT 
  '7. PROFILES RLS POLICIES' AS check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Check 8: List all existing profiles
SELECT 
  '8. EXISTING PROFILES' AS check_name,
  p.id,
  p.email,
  p.role,
  p.activated_at,
  u.email_confirmed_at,
  u.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check 9: Check for users without profiles
SELECT 
  '9. USERS WITHOUT PROFILES' AS check_name,
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Check 10: Test if service role can bypass RLS
SELECT 
  '10. RLS STATUS' AS check_name,
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('invitations', 'profiles');

-- =====================================================
-- RECOMMENDATIONS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '
  ═══════════════════════════════════════════════════
  DIAGNOSTIC RECOMMENDATIONS:
  ═══════════════════════════════════════════════════
  
  1. Check if SUPABASE_SERVICE_ROLE_KEY is configured
  2. Verify that signup is NOT disabled in Supabase Auth settings
  3. Check the server logs for detailed error messages
  4. Ensure the handle_new_user trigger is properly installed
  5. Verify RLS policies allow service role to create profiles
  
  Common Issues:
  - Missing service role key in environment variables
  - RLS policies blocking profile creation
  - Trigger function has syntax errors or missing permissions
  - User already exists in auth.users table
  - Email confirmation issues
  ';
END $$;

