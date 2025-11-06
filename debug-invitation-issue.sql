-- =====================================================
-- DEBUG INVITATION ISSUE
-- Run this to diagnose the problem
-- =====================================================

-- Step 1: Check if invitation exists and is valid
SELECT 
  'INVITATION CHECK' as check_type,
  id,
  email,
  token,
  status,
  expires_at,
  CASE 
    WHEN status != 'pending' THEN '❌ Status is not pending'
    WHEN expires_at < NOW() THEN '❌ Invitation expired'
    ELSE '✅ Invitation is valid'
  END as validation_status
FROM invitations
WHERE token = 'kqqGzJIYOifXXQeg4Xt1cPK0bv6U-nAejw9ew0oUcMw';

-- Step 2: Check if user already exists in auth.users
SELECT 
  'AUTH USER CHECK' as check_type,
  id,
  email,
  created_at,
  '❌ User already exists! Cannot create duplicate.' as issue
FROM auth.users
WHERE email = 'bhargavtelu101@gmail.com';

-- Step 3: Check if profile already exists
SELECT 
  'PROFILE CHECK' as check_type,
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN role = 'admin' THEN '✅ Already an admin'
    WHEN role = 'pending_invite' THEN '❌ Role is pending_invite, not admin'
    ELSE '❌ Unknown role'
  END as status
FROM profiles
WHERE email = 'bhargavtelu101@gmail.com';

-- Step 4: Check if trigger exists and is enabled
SELECT 
  'TRIGGER CHECK' as check_type,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM information_schema.triggers t
JOIN pg_trigger pt ON pt.tgname = t.trigger_name
WHERE trigger_name = 'on_auth_user_created' 
  AND event_object_table = 'users';

-- Step 5: Test the trigger function directly
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Check if function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✅ Trigger function handle_new_user() exists';
  ELSE
    RAISE NOTICE '❌ Trigger function handle_new_user() NOT FOUND';
  END IF;
END $$;

-- Step 6: Summary
SELECT '===========================================' as separator;
SELECT 'DIAGNOSIS SUMMARY' as title;
SELECT '===========================================' as separator;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM invitations WHERE token = 'kqqGzJIYOifXXQeg4Xt1cPK0bv6U-nAejw9ew0oUcMw' AND status = 'pending' AND expires_at > NOW())
    THEN '✅ Invitation is valid'
    ELSE '❌ Invitation invalid/expired'
  END as invitation_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ User already exists in auth.users'
    ELSE '✅ No existing user (ready to create)'
  END as user_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'bhargavtelu101@gmail.com')
    THEN '⚠️ Profile already exists'
    ELSE '✅ No existing profile'
  END as profile_status;

