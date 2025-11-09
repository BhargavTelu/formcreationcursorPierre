-- =====================================================
-- RECREATE USER FROM SCRATCH
-- This deletes and recreates the user with proper Supabase format
-- =====================================================

-- Step 1: Complete cleanup
DELETE FROM public.profiles WHERE email = 'bhargavtelu101@gmail.com';
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'bhargavtelu101@gmail.com');
DELETE FROM auth.users WHERE email = 'bhargavtelu101@gmail.com';

-- Step 2: Create user with proper Supabase format
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'bhargavtelu101@gmail.com';
  user_password TEXT := 'Bhargav@1234';
BEGIN
  -- Insert into auth.users with ALL required fields
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- instance_id
    new_user_id,                              -- id
    'authenticated',                          -- aud
    'authenticated',                          -- role
    user_email,                               -- email
    crypt(user_password, gen_salt('bf')),    -- encrypted_password
    NOW(),                                    -- email_confirmed_at
    NULL,                                     -- invited_at
    '',                                       -- confirmation_token
    NULL,                                     -- confirmation_sent_at
    '',                                       -- recovery_token
    NULL,                                     -- recovery_sent_at
    '',                                       -- email_change_token_new
    '',                                       -- email_change
    NULL,                                     -- email_change_sent_at
    NULL,                                     -- last_sign_in_at
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),  -- raw_app_meta_data
    '{}'::jsonb,                              -- raw_user_meta_data
    false,                                    -- is_super_admin
    NOW(),                                    -- created_at
    NOW(),                                    -- updated_at
    NULL,                                     -- phone
    NULL,                                     -- phone_confirmed_at
    '',                                       -- phone_change
    '',                                       -- phone_change_token
    NULL,                                     -- phone_change_sent_at
    '',                                       -- email_change_token_current
    0,                                        -- email_change_confirm_status
    NULL,                                     -- banned_until
    '',                                       -- reauthentication_token
    NULL,                                     -- reauthentication_sent_at
    false,                                    -- is_sso_user
    NULL                                      -- deleted_at
  );
  
  -- Create identity record
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
    new_user_id::text,
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
  
  RAISE NOTICE '✅ User recreated with ID: %', new_user_id;
END $$;

-- Step 3: Verify everything
SELECT 
  '✅ User created successfully' AS status,
  u.id,
  u.email,
  u.instance_id,
  u.aud,
  u.role,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  u.encrypted_password IS NOT NULL AS has_password,
  (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) AS identity_count,
  p.role AS profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'bhargavtelu101@gmail.com';

-- Step 4: Test password hash
SELECT 
  'Password verification:' AS test,
  email,
  encrypted_password = crypt('Bhargav@1234', encrypted_password) AS password_matches
FROM auth.users
WHERE email = 'bhargavtelu101@gmail.com';

