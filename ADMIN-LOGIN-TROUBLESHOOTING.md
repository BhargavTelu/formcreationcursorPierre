# Admin Login Troubleshooting Guide

## Problem: "Invalid login credentials" Error

If you're getting "Invalid login credentials" when trying to log in as admin, follow these steps:

## Step 1: Run Diagnostic Script

1. Go to **Supabase Dashboard → SQL Editor**
2. Run `DIAGNOSE-ADMIN-LOGIN.sql`
3. Review the output to identify issues

**Common Issues Found:**
- ❌ User NOT in auth.users
- ⚠️ Email not confirmed
- 🚫 User is banned
- 🗑️ User is deleted
- ⚠️ User in auth.users but NO profile

## Step 2: Run Fix Script

1. Go to **Supabase Dashboard → SQL Editor**
2. Run `FIX-ADMIN-LOGIN.sql`
3. This will:
   - Confirm all admin user emails
   - Create missing profiles
   - Fix role assignments
   - Remove bans/deletions

## Step 3: Verify User Exists

Run this query in Supabase SQL Editor:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.banned_until IS NULL as not_banned,
  u.deleted_at IS NULL as not_deleted,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL 
      AND u.banned_until IS NULL 
      AND u.deleted_at IS NULL 
      AND p.role = 'admin'
    THEN '✅ Ready to login'
    ELSE '❌ Issues found'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email.

## Step 4: Check Supabase Auth Settings

1. Go to **Supabase Dashboard → Authentication → Settings**
2. Check **"Enable email confirmations"**
   - If enabled: Users must confirm email before login
   - If disabled: Users can login immediately after creation
3. For this application, it should be **DISABLED** (we handle confirmation programmatically)

## Step 5: Reset Password (If Needed)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication → Users**
2. Find your user
3. Click on the user
4. Click **"Send password reset email"** or **"Reset password"**
5. Check your email and follow the reset link

### Option B: Delete and Recreate User

If password reset doesn't work:

1. **Delete the user** (in Supabase Dashboard → Authentication → Users)
2. **Recreate using bootstrap endpoint:**

```bash
curl -X POST http://localhost:3000/api/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword123!",
    "secret": "your-bootstrap-secret"
  }'
```

**Note:** Bootstrap only works if NO admin exists. If an admin already exists, you'll need to:
1. Delete the existing admin from Supabase Dashboard
2. Then use bootstrap endpoint

### Option C: Create New Admin via Invitation

1. Log in as an existing admin (if possible)
2. Go to `/admin/invite`
3. Send invitation to your email
4. Accept invitation and set password

## Step 6: Verify Environment Variables

Check your `.env.local` file has correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Restart your dev server after changing environment variables!

## Common Root Causes

### 1. Email Not Confirmed
**Symptom:** User exists but login fails
**Fix:** Run `FIX-ADMIN-LOGIN.sql` or manually confirm in Supabase Dashboard

### 2. User Doesn't Exist
**Symptom:** "Invalid login credentials" immediately
**Fix:** Create user using bootstrap endpoint or invitation system

### 3. Wrong Password
**Symptom:** "Invalid login credentials" with correct email
**Fix:** Reset password via Supabase Dashboard

### 4. User Banned or Deleted
**Symptom:** User exists but login fails
**Fix:** Run `FIX-ADMIN-LOGIN.sql` to remove bans/deletions

### 5. Missing Profile
**Symptom:** Login succeeds but redirected back to login
**Fix:** Run `FIX-ADMIN-LOGIN.sql` to create missing profiles

### 6. Email Confirmation Required in Supabase Settings
**Symptom:** User created but can't login
**Fix:** Disable "Enable email confirmations" in Supabase Auth settings, OR confirm email manually

## Quick Fix Checklist

- [ ] Run `DIAGNOSE-ADMIN-LOGIN.sql` to identify issues
- [ ] Run `FIX-ADMIN-LOGIN.sql` to fix common issues
- [ ] Verify user exists in `auth.users` table
- [ ] Verify user has `email_confirmed_at` set
- [ ] Verify user is not banned or deleted
- [ ] Verify user has profile with `role = 'admin'`
- [ ] Check Supabase Auth settings (email confirmation)
- [ ] Verify environment variables are correct
- [ ] Restart dev server
- [ ] Try logging in again

## Still Not Working?

If login still fails after all steps:

1. **Check server logs** for detailed error messages
2. **Verify Supabase connection** - Can you query the database?
3. **Test with a fresh user** - Create a completely new admin user
4. **Check Supabase status** - Is Supabase service operational?
5. **Verify API keys** - Are they correct and not expired?

## Prevention

To prevent this issue in the future:

1. Always use the bootstrap endpoint or invitation system to create admins
2. Don't manually modify `auth.users` table
3. Keep Supabase Auth settings consistent
4. Document admin user creation process
5. Regularly backup your database



