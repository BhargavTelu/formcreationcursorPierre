-- =====================================================
-- RESET ADMIN PASSWORD
-- Use this to reset an admin user's password
-- IMPORTANT: Replace the email and password below!
-- =====================================================

-- Replace these values:
\set email 'your-admin@example.com'
\set new_password 'YourNewSecurePassword123!'

-- Step 1: Find the user
DO $$
DECLARE
  user_id UUID;
  user_email TEXT;
BEGIN
  -- Get user ID
  SELECT id, email INTO user_id, user_email
  FROM auth.users
  WHERE email = :'email';
  
  IF user_id IS NULL THEN
    RAISE NOTICE '❌ User not found: %', :'email';
    RAISE NOTICE '   Check the email address and try again.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found user: % (ID: %)', user_email, user_id;
  
  -- Note: Password reset must be done via Supabase Admin API
  -- This script can only verify the user exists
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Password cannot be reset via SQL!';
  RAISE NOTICE '';
  RAISE NOTICE 'To reset the password, use one of these methods:';
  RAISE NOTICE '';
  RAISE NOTICE 'Method 1: Use Supabase Dashboard';
  RAISE NOTICE '  1. Go to Authentication → Users';
  RAISE NOTICE '  2. Find user: %', user_email;
  RAISE NOTICE '  3. Click "Reset Password" or "Send Password Reset Email"';
  RAISE NOTICE '';
  RAISE NOTICE 'Method 2: Use the bootstrap endpoint';
  RAISE NOTICE '  POST /api/bootstrap-admin';
  RAISE NOTICE '  (Only works if no admin exists)';
  RAISE NOTICE '';
  RAISE NOTICE 'Method 3: Delete and recreate user';
  RAISE NOTICE '  Run this SQL to delete:';
  RAISE NOTICE '  DELETE FROM auth.users WHERE id = ''%'';', user_id;
  RAISE NOTICE '  Then use bootstrap endpoint to recreate.';
  RAISE NOTICE '';
END $$;

-- Alternative: Show all admin users for reference
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as confirmed,
  u.created_at,
  p.role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY u.created_at DESC;



