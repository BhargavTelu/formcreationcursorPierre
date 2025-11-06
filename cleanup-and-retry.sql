-- =====================================================
-- CLEANUP AND RETRY - Complete Reset
-- Use this if you've tried to create the account multiple times
-- ⚠️ WARNING: This deletes the user and starts fresh
-- =====================================================

-- Step 1: Find and delete any existing user
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID if exists
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'bhargavtelu101@gmail.com';
  
  IF user_id IS NOT NULL THEN
    RAISE NOTICE 'Found existing user: %', user_id;
    
    -- Delete profile first (if exists)
    DELETE FROM profiles WHERE id = user_id;
    RAISE NOTICE 'Profile deleted';
    
    -- Delete user from auth.users
    -- Note: This requires service_role access
    DELETE FROM auth.users WHERE id = user_id;
    RAISE NOTICE 'User deleted from auth.users';
  ELSE
    RAISE NOTICE 'No existing user found';
  END IF;
END $$;

-- Step 2: Reset invitation status (make it fresh)
UPDATE invitations
SET status = 'pending',
    accepted_at = NULL,
    accepted_by = NULL
WHERE email = 'bhargavtelu101@gmail.com';

-- Step 3: Verify cleanup
SELECT '===========================================' as separator;
SELECT 'CLEANUP VERIFICATION' as title;
SELECT '===========================================' as separator;

-- Check auth.users
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'bhargavtelu101@gmail.com')
    THEN '❌ User still exists in auth.users'
    ELSE '✅ No user in auth.users (clean)'
  END as auth_users_status;

-- Check profiles
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'bhargavtelu101@gmail.com')
    THEN '❌ Profile still exists'
    ELSE '✅ No profile (clean)'
  END as profiles_status;

-- Check invitation
SELECT 
  email,
  status,
  expires_at > NOW() as is_valid,
  CASE 
    WHEN status = 'pending' AND expires_at > NOW() THEN '✅ Ready to use'
    ELSE '❌ Need to regenerate'
  END as invitation_status
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Step 4: Show the invitation URL to use
SELECT 
  '===========================================' as separator,
  'USE THIS URL TO CREATE ACCOUNT:' as instruction,
  'https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

SELECT '✅ Cleanup complete! Try creating your account again with the URL above.' as final_message;

