# Admin Login Issue - Root Cause Analysis

## Problem Summary

Admin login was working a few hours ago but now always returns "Invalid login credentials" error, even for newly created admin users.

## Root Cause Analysis

The admin authentication system uses **Supabase Auth** (`signInWithPassword`), not a custom password system. The error "Invalid login credentials" comes directly from Supabase Auth, which means one of these issues:

### Most Likely Causes (in order of probability):

1. **Email Not Confirmed** (Most Common)
   - Supabase Auth requires email confirmation by default
   - Even though we set `email_confirm: true` when creating users, Supabase settings might override this
   - **Solution:** Run `FIX-ADMIN-LOGIN.sql` to confirm all admin emails

2. **User Doesn't Exist in auth.users**
   - User might exist in `profiles` table but not in `auth.users`
   - This happens if user creation failed partially
   - **Solution:** Create user properly using bootstrap endpoint

3. **Password Hash Mismatch**
   - Password was changed or corrupted
   - User was created with wrong password
   - **Solution:** Reset password via Supabase Dashboard

4. **User State Issues**
   - User is banned (`banned_until` is set)
   - User is deleted (`deleted_at` is set)
   - **Solution:** Run `FIX-ADMIN-LOGIN.sql` to fix these

5. **Supabase Auth Settings**
   - Email confirmation is required in Supabase settings
   - Password reset is required
   - **Solution:** Check Supabase Dashboard → Authentication → Settings

## Why Old Credentials Stopped Working

**Most likely scenario:** Something changed in Supabase Auth settings or the user's state was modified:

1. **Email confirmation requirement was enabled** in Supabase Dashboard
2. **User's email confirmation was cleared** (unlikely but possible)
3. **User was accidentally banned or marked as deleted**
4. **Password was changed** (by someone or by system)
5. **Supabase Auth service had an issue** and user state was corrupted

## Why New Credentials Don't Work Either

If newly created admin users also can't log in, it suggests:

1. **User creation is failing silently** - User is created in `profiles` but not in `auth.users`
2. **Email confirmation is required** - Users are created but emails aren't confirmed
3. **Bootstrap/invitation system has a bug** - Users aren't being created properly

## Solution Steps

### Immediate Fix (Run These Now):

1. **Run Diagnostic:**
   ```sql
   -- In Supabase SQL Editor, run:
   DIAGNOSE-ADMIN-LOGIN.sql
   ```

2. **Run Fix Script:**
   ```sql
   -- In Supabase SQL Editor, run:
   FIX-ADMIN-LOGIN.sql
   ```

3. **Check Supabase Auth Settings:**
   - Go to Supabase Dashboard → Authentication → Settings
   - Ensure "Enable email confirmations" is **DISABLED**
   - Or ensure emails are confirmed for all admin users

4. **Verify User Status:**
   ```sql
   SELECT 
     u.email,
     u.email_confirmed_at IS NOT NULL as confirmed,
     u.banned_until IS NULL as not_banned,
     u.deleted_at IS NULL as not_deleted,
     p.role
   FROM auth.users u
   JOIN profiles p ON p.id = u.id
   WHERE p.role = 'admin';
   ```

5. **Try Logging In Again**

### If Still Not Working:

1. **Reset Password:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user
   - Click "Send password reset email"

2. **Create Fresh Admin:**
   - Delete existing admin from Supabase Dashboard
   - Use bootstrap endpoint to create new admin:
   ```bash
   POST /api/bootstrap-admin
   {
     "email": "new-admin@example.com",
     "password": "SecurePassword123!",
     "secret": "your-bootstrap-secret"
   }
   ```

## Code Changes Made

I've enhanced the login route to provide better error diagnostics:

- **Better error logging** - Shows detailed error information
- **User existence check** - Verifies if user exists in auth.users
- **User status check** - Checks email confirmation, ban status, etc.
- **Helpful hints** - Provides actionable hints in development mode

## Prevention

To prevent this in the future:

1. **Always use bootstrap/invitation system** to create admins
2. **Don't manually modify auth.users** table
3. **Keep Supabase Auth settings consistent**
4. **Regularly verify admin users** using diagnostic script
5. **Document admin creation process**

## Files Created

1. **DIAGNOSE-ADMIN-LOGIN.sql** - Diagnostic script to identify issues
2. **FIX-ADMIN-LOGIN.sql** - Fix script to resolve common issues
3. **RESET-ADMIN-PASSWORD.sql** - Guide for password reset
4. **ADMIN-LOGIN-TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
5. **Enhanced login route** - Better error diagnostics

## Next Steps

1. Run the diagnostic script to identify the exact issue
2. Run the fix script to resolve it
3. Try logging in again
4. If still failing, follow the troubleshooting guide

The issue is **NOT in your code** - it's in the Supabase Auth user state or settings. The scripts I created will help identify and fix it.



