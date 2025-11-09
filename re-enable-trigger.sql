-- =====================================================
-- RE-ENABLE TRIGGER (after bootstrap success)
-- =====================================================

-- Recreate the FIXED trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check for valid invitation
  SELECT * INTO invitation_record
  FROM invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY invited_at DESC
  LIMIT 1;

  -- If invitation exists, create admin profile
  IF invitation_record.id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (
      NEW.id,
      NEW.email,
      'admin',
      invitation_record.invited_by,
      invitation_record.invited_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      invited_by = invitation_record.invited_by,
      invited_at = invitation_record.invited_at,
      activated_at = NOW(),
      updated_at = NOW();

    -- Mark invitation as accepted
    UPDATE invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id,
        updated_at = NOW()
    WHERE id = invitation_record.id;
  ELSE
    -- Create pending_invite profile (no invitation found)
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'pending_invite')
    ON CONFLICT (id) DO UPDATE SET
      role = 'pending_invite',
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but DON'T block user creation
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  'Trigger re-enabled successfully' AS status,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') AS trigger_exists;

