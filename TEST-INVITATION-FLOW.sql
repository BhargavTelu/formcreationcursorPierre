-- =====================================================
-- TEST ADMIN INVITATION FLOW
-- This script helps you test the invitation system manually
-- =====================================================

-- Configuration: Change these values for your test
\set test_email 'test-admin@example.com'

-- Step 1: Clean up any existing test data
DELETE FROM public.profiles WHERE email = :'test_email';
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = :'test_email'
);
DELETE FROM auth.users WHERE email = :'test_email';
DELETE FROM public.invitations WHERE email = :'test_email';

-- Step 2: Create a test invitation (simulating what your app does)
DO $$
DECLARE
  test_token TEXT := encode(gen_random_bytes(32), 'hex');
  test_token_hash TEXT;
BEGIN
  test_token_hash := encode(digest(test_token, 'sha256'), 'hex');
  
  INSERT INTO public.invitations (
    email,
    token_hash,
    status,
    invited_by,
    invited_at,
    expires_at,
    last_sent_at
  ) VALUES (
    :'test_email',
    test_token_hash,
    'pending',
    NULL,
    NOW(),
    NOW() + INTERVAL '48 hours',
    NOW()
  );
  
  RAISE NOTICE '✅ Test invitation created';
  RAISE NOTICE '📧 Email: %', :'test_email';
  RAISE NOTICE '🔑 Token (for testing): %', test_token;
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Test URL: http://localhost:3000/invite/accept?token=%', test_token;
END $$;

-- Step 3: Verify invitation was created
SELECT 
  '✅ INVITATION CREATED' AS status,
  email,
  status,
  invited_at,
  expires_at,
  expires_at > NOW() AS is_valid
FROM public.invitations
WHERE email = :'test_email';

-- Step 4: Simulate user creation (what Supabase does when accepting invitation)
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Create the user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    :'test_email',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Test user created with ID: %', new_user_id;
  
  -- The trigger should automatically create the profile
  -- Wait a moment for the trigger to fire
  PERFORM pg_sleep(0.5);
END $$;

-- Step 5: Verify trigger created the profile with admin role
SELECT 
  '✅ PROFILE CREATED BY TRIGGER' AS status,
  p.id,
  p.email,
  p.role,
  p.activated_at IS NOT NULL AS is_activated
FROM public.profiles p
WHERE p.email = :'test_email';

-- Step 6: Verify invitation was marked as accepted
SELECT 
  '✅ INVITATION ACCEPTED' AS status,
  email,
  status,
  accepted_at IS NOT NULL AS was_accepted,
  accepted_by IS NOT NULL AS has_acceptor
FROM public.invitations
WHERE email = :'test_email';

-- Step 7: Verify user can authenticate
SELECT 
  '✅ USER AUTH INFO' AS status,
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.encrypted_password IS NOT NULL AS has_password,
  (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) AS identity_count
FROM auth.users u
WHERE u.email = :'test_email';

-- Step 8: Test password verification
SELECT 
  '✅ PASSWORD TEST' AS status,
  email,
  encrypted_password = crypt('TestPassword123!', encrypted_password) AS password_works
FROM auth.users
WHERE email = :'test_email';

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
DECLARE
  invitation_status TEXT;
  profile_exists BOOLEAN;
  profile_role TEXT;
  user_exists BOOLEAN;
  test_passed BOOLEAN := TRUE;
BEGIN
  -- Check invitation
  SELECT status INTO invitation_status 
  FROM public.invitations 
  WHERE email = :'test_email';
  
  -- Check profile
  SELECT TRUE, role INTO profile_exists, profile_role 
  FROM public.profiles 
  WHERE email = :'test_email';
  
  -- Check user
  SELECT TRUE INTO user_exists 
  FROM auth.users 
  WHERE email = :'test_email';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'TEST RESULTS FOR: %', :'test_email';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Test 1: Invitation created
  IF invitation_status IS NOT NULL THEN
    RAISE NOTICE '✅ Test 1: Invitation created';
  ELSE
    RAISE NOTICE '❌ Test 1: Invitation NOT created';
    test_passed := FALSE;
  END IF;
  
  -- Test 2: User created
  IF user_exists THEN
    RAISE NOTICE '✅ Test 2: User created in auth.users';
  ELSE
    RAISE NOTICE '❌ Test 2: User NOT created in auth.users';
    test_passed := FALSE;
  END IF;
  
  -- Test 3: Profile created by trigger
  IF profile_exists THEN
    RAISE NOTICE '✅ Test 3: Profile created (trigger worked)';
  ELSE
    RAISE NOTICE '❌ Test 3: Profile NOT created (trigger FAILED)';
    test_passed := FALSE;
  END IF;
  
  -- Test 4: Profile has admin role
  IF profile_role = 'admin' THEN
    RAISE NOTICE '✅ Test 4: Profile has admin role';
  ELSE
    RAISE NOTICE '❌ Test 4: Profile has wrong role: %', COALESCE(profile_role, 'NULL');
    test_passed := FALSE;
  END IF;
  
  -- Test 5: Invitation marked as accepted
  IF invitation_status = 'accepted' THEN
    RAISE NOTICE '✅ Test 5: Invitation marked as accepted';
  ELSE
    RAISE NOTICE '❌ Test 5: Invitation status is: %', COALESCE(invitation_status, 'NULL');
    test_passed := FALSE;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  
  IF test_passed THEN
    RAISE NOTICE '✅✅✅ ALL TESTS PASSED! ✅✅✅';
    RAISE NOTICE 'Your invitation system is working correctly!';
    RAISE NOTICE '';
    RAISE NOTICE 'Test credentials:';
    RAISE NOTICE '  Email: %', :'test_email';
    RAISE NOTICE '  Password: TestPassword123!';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now try logging in with these credentials';
    RAISE NOTICE 'at: http://localhost:3000/admin';
  ELSE
    RAISE NOTICE '❌❌❌ SOME TESTS FAILED ❌❌❌';
    RAISE NOTICE 'Please review the errors above and run:';
    RAISE NOTICE '  1. INVITATION-DIAGNOSTIC.sql (to diagnose)';
    RAISE NOTICE '  2. FIX-INVITATION-SYSTEM.sql (to fix)';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- =====================================================
-- CLEANUP (uncomment to remove test data)
-- =====================================================

-- DELETE FROM public.profiles WHERE email = :'test_email';
-- DELETE FROM auth.identities WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = :'test_email'
-- );
-- DELETE FROM auth.users WHERE email = :'test_email';
-- DELETE FROM public.invitations WHERE email = :'test_email';
-- SELECT '🧹 Test data cleaned up' AS status;

