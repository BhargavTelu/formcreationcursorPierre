-- =====================================================
-- FIX TOKEN GENERATION & REGENERATE INVITATION
-- This fixes the URL-unsafe token issue
-- =====================================================

-- Step 1: Drop and recreate the token generation function with URL-safe encoding
DROP FUNCTION IF EXISTS generate_invitation_token();

CREATE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token_bytes BYTEA;
  token_b64 TEXT;
BEGIN
  -- Generate 32 random bytes
  token_bytes := gen_random_bytes(32);
  
  -- Encode to base64
  token_b64 := encode(token_bytes, 'base64');
  
  -- Make URL-safe: replace + with -, / with _, and remove =
  token_b64 := replace(token_b64, '+', '-');
  token_b64 := replace(token_b64, '/', '_');
  token_b64 := replace(token_b64, '=', '');
  
  RETURN token_b64;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Delete old invitation(s) for your email
DELETE FROM invitations WHERE email = 'bhargavtelu101@gmail.com';

-- Step 3: Create new invitation with URL-safe token
INSERT INTO invitations (email, token, invited_by, status, expires_at)
VALUES (
  'bhargavtelu101@gmail.com',
  generate_invitation_token(),
  NULL,
  'pending',
  NOW() + INTERVAL '30 days'
);

-- Step 4: Get the new invitation URL
SELECT 
  email,
  'https://www.finestafrica.ai/invite/accept?token=' || token as invitation_url,
  'http://localhost:3000/invite/accept?token=' || token as local_url,
  expires_at,
  status
FROM invitations 
WHERE email = 'bhargavtelu101@gmail.com'
ORDER BY created_at DESC 
LIMIT 1;

-- Verification
SELECT '✅ New invitation created with URL-safe token!' as status;
SELECT 'Copy the invitation_url from the results above' as next_step;

