-- =====================================================
-- FIX ADMIN LOGIN ISSUES
-- This script fixes common admin login problems
-- =====================================================

-- Step 1: Confirm all admin user emails (if they're unconfirmed)
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'admin'
)
AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);

-- Step 2: Ensure all admin users have profiles
INSERT INTO profiles (id, email, role, created_at, updated_at, activated_at)
SELECT 
  u.id,
  u.email,
  'admin',
  COALESCE(u.created_at, NOW()),
  NOW(),
  COALESCE(u.email_confirmed_at, NOW())
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW(),
  activated_at = COALESCE(profiles.activated_at, NOW());

-- Step 3: Ensure all profiles have matching admin role
UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
)
AND role != 'admin';

-- Step 4: Remove any bans or deletions
UPDATE auth.users
SET 
  banned_until = NULL,
  deleted_at = NULL
WHERE id IN (
  SELECT id FROM profiles WHERE role = 'admin'
)
AND (banned_until IS NOT NULL OR deleted_at IS NOT NULL);

-- Step 5: Verify the fix
DO $$
DECLARE
  fixed_count INT;
  admin_count INT;
  confirmed_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM profiles WHERE role = 'admin';
  
  SELECT COUNT(*) INTO confirmed_count
  FROM auth.users u
  JOIN profiles p ON p.id = u.id
  WHERE p.role = 'admin'
    AND u.email_confirmed_at IS NOT NULL
    AND u.banned_until IS NULL
    AND u.deleted_at IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '              FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Total admin profiles: %', admin_count;
  RAISE NOTICE 'Confirmed and active admins: %', confirmed_count;
  RAISE NOTICE '';
  
  IF confirmed_count = admin_count AND admin_count > 0 THEN
    RAISE NOTICE '✅✅✅ ALL ADMINS ARE READY TO LOGIN! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'If login still fails, the password might be wrong.';
    RAISE NOTICE 'You can reset passwords using the bootstrap endpoint';
    RAISE NOTICE 'or create a new admin user.';
  ELSIF admin_count = 0 THEN
    RAISE NOTICE '⚠️  No admin users found!';
    RAISE NOTICE '    Create an admin using /api/bootstrap-admin';
  ELSE
    RAISE NOTICE '⚠️  Some admins may still have issues.';
    RAISE NOTICE '    Check the diagnostic script for details.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- Show final status
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.banned_until IS NULL as not_banned,
  u.deleted_at IS NULL as not_deleted,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL 
      AND u.banned_until IS NULL 
      AND u.deleted_at IS NULL 
      AND p.role = 'admin'
    THEN '✅ Ready to login'
    ELSE '❌ Issues found'
  END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY u.created_at DESC;



