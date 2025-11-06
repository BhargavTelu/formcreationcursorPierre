-- =====================================================
-- BOOTSTRAP FIRST ADMIN USER
-- Run this in Supabase SQL Editor to create your first admin
-- =====================================================

-- STEP 1: Replace this with your actual email address
-- ⚠️ IMPORTANT: Change 'your-email@example.com' below to your real email
DO $$
DECLARE
  admin_email TEXT := 'your-email@example.com';  -- ← CHANGE THIS!
  invite_token TEXT;
BEGIN
  -- Generate secure token
  invite_token := encode(gen_random_bytes(32), 'base64');
  
  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE email = admin_email AND status = 'pending'
  ) THEN
    RAISE NOTICE 'Invitation already exists for %. Skipping...', admin_email;
  ELSE
    -- Create invitation
    INSERT INTO invitations (
      email,
      token,
      invited_by,
      status,
      expires_at
    ) VALUES (
      admin_email,
      invite_token,
      NULL, -- System invitation (no specific inviter)
      'pending',
      NOW() + INTERVAL '30 days'
    );
    
    RAISE NOTICE '✅ Invitation created successfully!';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Token: %', invite_token;
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Invitation URL:';
    RAISE NOTICE 'https://finestafrica.ai/invite/accept?token=%', invite_token;
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Copy the URL above';
    RAISE NOTICE '2. Open it in your browser';
    RAISE NOTICE '3. Set your password';
    RAISE NOTICE '4. You''re all set as an admin!';
  END IF;
END $$;

-- STEP 2: View the invitation details
SELECT 
  email,
  token,
  'https://finestafrica.ai/invite/accept?token=' || token as invitation_url,
  expires_at,
  status,
  created_at
FROM invitations 
WHERE email = 'your-email@example.com'  -- ← CHANGE THIS TOO!
ORDER BY created_at DESC 
LIMIT 1;

-- =====================================================
-- ALTERNATIVE: Manually Upgrade Existing User to Admin
-- (Use this if you already have an account)
-- =====================================================

-- Uncomment and run this if you already signed up and want to become admin:

-- UPDATE profiles 
-- SET 
--   role = 'admin',
--   activated_at = NOW()
-- WHERE email = 'your-email@example.com';  -- ← CHANGE THIS!

-- SELECT 
--   email,
--   role,
--   activated_at
-- FROM profiles 
-- WHERE email = 'your-email@example.com';  -- ← CHANGE THIS!

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check admin count
SELECT 
  COUNT(*) as admin_count,
  array_agg(email) as admin_emails
FROM profiles 
WHERE role = 'admin';

-- Check pending invitations
SELECT 
  COUNT(*) as pending_invitations
FROM invitations 
WHERE status = 'pending' AND expires_at > NOW();

-- Show dashboard stats
SELECT * FROM admin_dashboard_stats;

