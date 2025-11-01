-- ============================================
-- CREATE FIRST ADMIN USER - SQL SCRIPT
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. First, create the user via Supabase Dashboard:
--    - Go to Authentication → Users → Add User
--    - Enter email and password
--    - Check "Auto Confirm User"
--    - Copy the User ID
--
-- 2. Then run this script, replacing:
--    - 'your-email@example.com' with your actual email
--    - 'YOUR_USER_ID_HERE' with the User ID from step 1
--
-- ============================================

-- Option 1: If you have the User ID (Recommended)
-- Replace the values below:

INSERT INTO admin_users (
  email,
  user_id,
  status,
  is_active,
  activated_at
)
VALUES (
  'your-email@example.com',  -- ⚠️ CHANGE THIS to your email
  'YOUR_USER_ID_HERE',       -- ⚠️ CHANGE THIS to User ID from Supabase Dashboard
  'active',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  user_id = EXCLUDED.user_id,
  status = 'active',
  is_active = true,
  activated_at = NOW()
RETURNING *;

-- ============================================
-- Option 2: Find user by email automatically
-- ============================================
-- If you already created the user but don't have the ID,
-- use this query (it will find the user by email):

/*
INSERT INTO admin_users (
  email,
  user_id,
  status,
  is_active,
  activated_at
)
SELECT 
  u.email,
  u.id,
  'active',
  true,
  NOW()
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- ⚠️ CHANGE THIS to your email
  AND u.email_confirmed_at IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET 
  user_id = EXCLUDED.user_id,
  status = 'active',
  is_active = true,
  activated_at = NOW()
RETURNING *;
*/

-- ============================================
-- Verify the admin was created successfully
-- ============================================

SELECT 
  au.id,
  au.email,
  au.status,
  au.is_active,
  au.activated_at,
  au.user_id,
  u.email as auth_email,
  u.email_confirmed_at,
  CASE 
    WHEN au.status = 'active' AND au.is_active = true THEN '✅ Admin Active'
    ELSE '❌ Admin Not Active'
  END as status_check
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'your-email@example.com';  -- ⚠️ CHANGE THIS to your email

