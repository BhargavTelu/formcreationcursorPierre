-- =====================================================
-- MANUAL ADMIN CREATION (100% Reliable Method)
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =====================================================

-- Clean up any existing attempts
DELETE FROM public.profiles WHERE email = 'bhargavtelu101@gmail.com';
DELETE FROM auth.users WHERE email = 'bhargavtelu101@gmail.com';

-- Create the user directly in auth.users with proper password hash
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'bhargavtelu101@gmail.com';
  user_password TEXT := 'Bhargav@1234';
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_sent_at,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_sent_at,
    reauthentication_token,
    is_sso_user,
    deleted_at,
    aud,
    role
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf', 10)),  -- Password: Bhargav@1234
    NOW(),  -- Email already confirmed
    NULL,
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    '{}'::jsonb,
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    NULL,
    '',
    '',
    0,
    NULL,
    NULL,
    '',
    false,
    NULL,
    'authenticated',
    'authenticated'
  );
  
  -- Create identity record (required for email/password auth)
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id::text,  -- provider_id is the user's ID as a string
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', user_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Create admin profile
  INSERT INTO public.profiles (
    id,
    email,
    role,
    invited_by,
    invited_at,
    activated_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    'admin',
    NULL,
    NOW(),
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ SUCCESS! Admin user created with ID: %', new_user_id;
  RAISE NOTICE '📧 Email: %', user_email;
  RAISE NOTICE '🔑 Password: %', user_password;
END $$;

-- Verify the user was created successfully
SELECT 
  '✅ User created successfully!' AS status,
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  p.role AS profile_role,
  p.activated_at IS NOT NULL AS activated,
  (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) AS identity_count
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'bhargavtelu101@gmail.com';

