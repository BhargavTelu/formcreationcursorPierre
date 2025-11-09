-- =====================================================
-- CHECK INVITATION SYSTEM
-- Run this to diagnose invitation acceptance issues
-- =====================================================

-- Check 1: Verify the trigger exists and is enabled
SELECT 
  '1. TRIGGER STATUS' AS check_name,
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Check 2: Verify the trigger function exists
SELECT 
  '2. TRIGGER FUNCTION' AS check_name,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Check 3: Check recent invitations
SELECT 
  '3. RECENT INVITATIONS' AS check_name,
  email,
  status,
  invited_at,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN '⚠️ EXPIRED'
    WHEN status = 'pending' THEN '✅ VALID'
    ELSE status
  END AS invitation_status
FROM public.invitations
ORDER BY created_at DESC
LIMIT 5;

-- Check 4: Check if profiles are being created
SELECT 
  '4. RECENT PROFILES' AS check_name,
  email,
  role,
  activated_at,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Check 5: Check for users without profiles
SELECT 
  '5. USERS WITHOUT PROFILES' AS check_name,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 5;

-- Check 6: Test the trigger function manually
DO $$
DECLARE
  test_email TEXT := 'test@example.com';
  test_invitation_id UUID;
  test_user_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '          INVITATION SYSTEM DIAGNOSTIC';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger exists: on_auth_user_created';
  ELSE
    RAISE NOTICE '❌ Trigger MISSING: on_auth_user_created';
    RAISE NOTICE '   FIX: Run FIX-INVITATION-SYSTEM.sql or FINAL-FIX.sql';
  END IF;
  
  -- Check function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Function exists: handle_new_user()';
  ELSE
    RAISE NOTICE '❌ Function MISSING: handle_new_user()';
    RAISE NOTICE '   FIX: Run FIX-INVITATION-SYSTEM.sql';
  END IF;
  
  -- Check helper function for RLS
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'is_admin'
  ) THEN
    RAISE NOTICE '✅ Function exists: is_admin()';
  ELSE
    RAISE NOTICE '❌ Function MISSING: is_admin()';
    RAISE NOTICE '   FIX: Run FINAL-FIX.sql';
  END IF;
  
  -- Check for pending invitations
  SELECT COUNT(*) INTO test_user_id
  FROM public.invitations
  WHERE status = 'pending' AND expires_at > NOW();
  
  RAISE NOTICE '📧 Pending invitations: %', test_user_id;
  
  -- Check for orphaned users (in auth.users but not profiles)
  SELECT COUNT(*) INTO test_user_id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;
  
  IF test_user_id > 0 THEN
    RAISE NOTICE '⚠️  Users without profiles: % (trigger may not be working!)', test_user_id;
  ELSE
    RAISE NOTICE '✅ No orphaned users (trigger is working)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

