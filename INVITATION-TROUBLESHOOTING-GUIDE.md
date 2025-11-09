# 🔧 Admin Invitation System - Troubleshooting Guide

## 📋 Problem Summary

You were encountering the error **"Unable to create administrator account."** when trying to accept admin invitations.

---

## 🔍 Root Cause Analysis

After a deep analysis of your application, I identified several issues:

### Issue #1: Duplicate Invitation Pages ❌ **FIXED**
Your application had **TWO different invitation acceptance pages**:

1. **BROKEN PAGE** (❌ Deleted):
   - Location: `/app/admin/accept-invitation/page.tsx`
   - Problem: Called non-existent API endpoints
   - Impact: Would always fail with errors

2. **WORKING PAGE** (✅ Kept):
   - Location: `/app/invite/accept/page.tsx`
   - Uses: `AcceptInviteForm` component
   - Calls: Correct endpoints (`/api/invite/validate` and `/api/invite/accept`)

**Good News**: Your email system correctly sends invitations to the working page (`/invite/accept?token=xxx`)

### Issue #2: Insufficient Error Logging ❌ **FIXED**
The API endpoint wasn't providing detailed error information, making it hard to diagnose issues.

**Fixed**: Added comprehensive error logging in `/app/api/invite/accept/route.ts`

### Issue #3: Potential Database Issues ⚠️ **Needs Verification**
Several database-related issues could cause user creation to fail:

1. Missing or incorrect `SUPABASE_SERVICE_ROLE_KEY`
2. Database trigger (`handle_new_user`) not properly configured
3. Row Level Security (RLS) policies blocking operations
4. User already exists in the auth system

---

## ✅ What I've Fixed

### 1. Deleted Broken Invitation Page ✓
- Removed `/app/admin/accept-invitation/page.tsx`
- This eliminates confusion and ensures only the correct page is used

### 2. Enhanced Error Logging ✓
- Updated `/app/api/invite/accept/route.ts` with detailed error messages
- Now logs complete error objects including:
  - Error message
  - Status code
  - Email being processed
  - Full error details

### 3. Created Diagnostic Tools ✓
- `INVITATION-DIAGNOSTIC.sql` - Run this to check your database setup
- `FIX-INVITATION-SYSTEM.sql` - Run this to fix common database issues

---

## 🚀 Step-by-Step Fix Instructions

### Step 1: Verify Environment Variables

Check your `.env.local` or `.env` file has these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ⚠️ CRITICAL!
```

**Where to find these:**
1. Go to your Supabase Dashboard
2. Navigate to **Settings > API**
3. Copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this SECRET!**

### Step 2: Run Database Diagnostic

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste contents of `INVITATION-DIAGNOSTIC.sql`
5. Run the query
6. Review the output - it will show you what's wrong

### Step 3: Fix Database Issues

1. In **Supabase SQL Editor**
2. Copy and paste contents of `FIX-INVITATION-SYSTEM.sql`
3. Run the query
4. This will:
   - Recreate the `handle_new_user` trigger with proper permissions
   - Fix RLS policies
   - Grant necessary permissions
   - Verify setup

### Step 4: Verify Supabase Auth Settings

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication > Providers**
3. Ensure **Email** provider is enabled:
   - ✅ Enable email provider: **ON**
   - ✅ Confirm email: Can be **OFF** (we handle this programmatically)
4. Check **Authentication > Settings**:
   - ⚠️ Make sure "Enable email signups" is **ON**

### Step 5: Restart Your Application

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 6: Test the Invitation Flow

1. **Send a new invitation**:
   - Log into admin panel
   - Go to invite page
   - Send invitation to a test email

2. **Accept the invitation**:
   - Check the email or copy the invitation URL
   - URL should look like: `http://localhost:3000/invite/accept?token=xxxxx`
   - Open the URL in a private/incognito window
   - Set a password (minimum 12 characters)
   - Submit the form

3. **Check for errors**:
   - If it fails, check the server console logs (where you ran `npm run dev`)
   - Look for `[Invite]` prefixed log messages
   - The detailed error will be logged

---

## 🐛 Common Issues and Solutions

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable"

**Cause**: The service role key is not set in your environment variables.

**Fix**:
1. Get the service role key from Supabase Dashboard > Settings > API
2. Add it to your `.env.local` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. Restart your dev server

---

### Error: "User already exists" or similar

**Cause**: The email was already used to create a user.

**Fix**:
1. Go to Supabase Dashboard > Authentication > Users
2. Find the user with that email
3. Delete the user
4. Also delete from `public.profiles` table if exists:
   ```sql
   DELETE FROM public.profiles WHERE email = 'user@example.com';
   ```
5. Try the invitation again

---

### Error: "Permission denied" or "RLS policy violation"

**Cause**: Row Level Security policies are blocking the operation.

**Fix**:
1. Run the `FIX-INVITATION-SYSTEM.sql` script
2. This will recreate RLS policies with proper permissions
3. The service role should bypass RLS automatically

---

### Error: "Trigger function error"

**Cause**: The `handle_new_user` trigger has an error.

**Fix**:
1. Run the `FIX-INVITATION-SYSTEM.sql` script
2. This recreates the trigger with proper error handling
3. Check PostgreSQL logs in Supabase Dashboard > Database > Logs

---

### Invitation Link Goes to Wrong Page

**Cause**: Someone manually typed the wrong URL or used a cached link.

**Fix**:
- Correct URL format: `https://yourdomain.com/invite/accept?token=xxxxx`
- NOT: `https://yourdomain.com/admin/accept-invitation?token=xxxxx` ❌
- The broken page has been deleted, so wrong URLs will show 404

---

## 📊 Monitoring and Debugging

### Check Server Logs

When accepting an invitation, you should see logs like:

```
[Invite] Processing invitation acceptance
[Invite] Found valid invitation for: user@example.com
[Invite] User created successfully: uuid-here
[Invite] Profile created and invitation marked as accepted
```

If you see errors, they will be detailed:

```
[Invite] Failed to create user {
  error: { ... },
  message: 'User with this email already exists',
  status: 422,
  email: 'user@example.com'
}
```

### Check Database Directly

```sql
-- Check pending invitations
SELECT * FROM public.invitations WHERE status = 'pending';

-- Check if user exists
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Check if profile exists
SELECT * FROM public.profiles WHERE email = 'user@example.com';
```

---

## 🎯 Testing Checklist

- [ ] Environment variables are set (especially `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Database diagnostic script runs without errors
- [ ] Database fix script applied successfully
- [ ] Supabase email provider is enabled
- [ ] Application restarted after changes
- [ ] New invitation sent successfully
- [ ] Invitation email received with correct link format
- [ ] Can access invitation page without errors
- [ ] Can set password and submit form
- [ ] User created in auth.users table
- [ ] Profile created in profiles table with role='admin'
- [ ] Invitation status changed to 'accepted'
- [ ] Can log in with new credentials

---

## 🆘 Still Having Issues?

If you're still experiencing problems after following this guide:

### 1. Collect Debug Information

Run this in your Supabase SQL Editor:

```sql
-- Get complete diagnostic information
SELECT 'INVITATIONS' as table_name, * FROM public.invitations WHERE email = 'problematic@email.com'
UNION ALL
SELECT 'PROFILES' as table_name, * FROM public.profiles WHERE email = 'problematic@email.com'
UNION ALL
SELECT 'AUTH_USERS' as table_name, * FROM auth.users WHERE email = 'problematic@email.com';
```

### 2. Check Server Logs

Copy the complete error message from your server console (where you run `npm run dev`).

### 3. Verify API Endpoints

Test the endpoints directly:

```bash
# Test validation endpoint
curl "http://localhost:3000/api/invite/validate?token=YOUR_TOKEN_HERE"

# Should return:
# {"success":true,"data":{"email":"t***i@gmail.com","expiresAt":"2025-11-11T13:07:04.000Z"}}
```

### 4. Manual User Creation Test

To isolate if the issue is with Supabase or your code:

```sql
-- Try creating a user directly in Supabase SQL Editor
-- This tests if the trigger and RLS policies work
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW()
) RETURNING id, email;
```

If this works but the API doesn't, the issue is with the service role key or API configuration.

---

## 📚 Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Database Triggers**: https://supabase.com/docs/guides/database/postgres/triggers

---

## 📝 Summary of Changes Made

1. ✅ Deleted broken duplicate page: `/app/admin/accept-invitation/page.tsx`
2. ✅ Enhanced error logging in `/app/api/invite/accept/route.ts`
3. ✅ Created comprehensive diagnostic SQL script
4. ✅ Created database fix SQL script
5. ✅ Created this troubleshooting guide

**Next Steps**: Follow the step-by-step instructions above to verify your setup and test the invitation flow again.

