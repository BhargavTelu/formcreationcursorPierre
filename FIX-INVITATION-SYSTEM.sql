-- =====================================================
-- FIX ADMIN INVITATION SYSTEM
-- Run this script to fix common invitation issues
-- =====================================================

-- Step 1: Ensure the trigger function has proper permissions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This is critical - allows function to bypass RLS
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Log the user creation
  RAISE NOTICE 'handle_new_user triggered for email: %', NEW.email;
  
  -- Look for a valid invitation
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY invited_at DESC
  LIMIT 1;

  IF invitation_record.id IS NOT NULL THEN
    -- Valid invitation found
    RAISE NOTICE 'Found valid invitation for: %', NEW.email;
    
    -- Create admin profile
    INSERT INTO public.profiles (id, email, role, invited_by, invited_at, activated_at)
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
    UPDATE public.invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = NEW.id,
        updated_at = NOW()
    WHERE id = invitation_record.id;
    
    RAISE NOTICE 'Admin profile created successfully for: %', NEW.email;
  ELSE
    -- No valid invitation, create pending_invite profile
    RAISE NOTICE 'No valid invitation found for: %, creating pending_invite profile', NEW.email;
    
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'pending_invite')
    ON CONFLICT (id) DO UPDATE SET
      role = CASE 
        WHEN profiles.role != 'admin' THEN 'pending_invite'
        ELSE profiles.role
      END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'handle_new_user error for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 2: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Ensure RLS policies allow service role operations
-- Drop existing policies
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;
DROP POLICY IF EXISTS "Invitations: admin manage" ON public.invitations;
DROP POLICY IF EXISTS "invitations_service_role" ON public.invitations;

-- Create comprehensive RLS policy for invitations
CREATE POLICY "invitations_admin_manage"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow service role to bypass RLS (this is handled automatically by Supabase)
-- Regular RLS is sufficient - FORCE RLS can block legitimate queries
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
-- Note: NOT using FORCE ROW LEVEL SECURITY

-- Step 5: Update profiles RLS policies
DROP POLICY IF EXISTS "Profiles: users can view own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_view_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "profiles_view_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "profiles_admin_manage"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Note: NOT using FORCE ROW LEVEL SECURITY as it blocks legitimate login queries

-- Step 6: Verify setup
SELECT 
  '✅ Trigger installed' AS status,
  COUNT(*) AS trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

SELECT 
  '✅ Function created' AS status,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

SELECT 
  '✅ Invitations RLS enabled' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invitations';

SELECT 
  '✅ Profiles RLS enabled' AS status,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Step 7: Show reminder
DO $$
BEGIN
  RAISE NOTICE '
  ══════════════════════════════════════════════════════════════
  ✅ INVITATION SYSTEM FIXED
  ══════════════════════════════════════════════════════════════
  
  IMPORTANT: You must also check:
  
  1. Environment Variables (.env):
     - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key ⚠️ CRITICAL
  
  2. Supabase Dashboard:
     - Go to Authentication > Providers
     - Make sure "Enable email provider" is ON
     - "Confirm email" can be OFF (we confirm programmatically)
  
  3. Test the invitation flow again
  
  ══════════════════════════════════════════════════════════════
  ';
END $$;

