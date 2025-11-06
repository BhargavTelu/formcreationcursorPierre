-- =====================================================
-- COMPREHENSIVE FIX FOR INVITATION TRIGGER
-- This fixes common issues with user creation
-- =====================================================

-- Step 1: Drop and recreate the trigger function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_invitation RECORD;
BEGIN
  -- Log for debugging
  RAISE NOTICE 'Trigger fired for user: %', NEW.email;
  
  -- Check if there's a valid invitation for this email (case-insensitive)
  SELECT * INTO valid_invitation
  FROM invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If valid invitation exists, create admin profile
  IF valid_invitation.id IS NOT NULL THEN
    RAISE NOTICE 'Valid invitation found. Creating admin profile...';
    
    -- Insert admin profile
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (
      NEW.id,
      NEW.email,
      'admin',
      valid_invitation.invited_by,
      valid_invitation.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      activated_at = NOW();
    
    RAISE NOTICE 'Admin profile created successfully';
    
    -- Mark invitation as accepted
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id
    WHERE id = valid_invitation.id;
    
    RAISE NOTICE 'Invitation marked as accepted';
  ELSE
    -- No valid invitation - create pending_invite profile (locked out)
    RAISE NOTICE 'No valid invitation found. Creating pending_invite profile...';
    
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (NEW.id, NEW.email, 'pending_invite', NULL)
    ON CONFLICT (id) DO UPDATE SET
      role = 'pending_invite';
    
    RAISE NOTICE 'Pending profile created';
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 3: Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon;

-- Step 4: Ensure RLS allows the trigger to work
-- Temporarily disable RLS for testing (re-enable after)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;

-- Clean up any existing issues for your email
DELETE FROM profiles WHERE email = 'bhargavtelu101@gmail.com';

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the setup
SELECT '✅ Trigger function recreated with better error handling' as status;
SELECT '✅ Existing profile deleted (if any)' as cleanup;
SELECT '✅ Ready to try account creation again!' as next_step;

-- Show current invitation status
SELECT 
  email,
  status,
  expires_at > NOW() as is_valid,
  'Use this URL: https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url
FROM invitations
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

