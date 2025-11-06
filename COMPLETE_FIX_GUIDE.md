# Complete Fix Guide for "Database error finding user"

## 🔍 Root Cause Analysis

The error "Database error finding user" occurs because:

1. **The database trigger isn't creating the profile** after user signup
2. **OR** The profile is created but RLS policies prevent reading it
3. **OR** A user/profile already exists from a previous failed attempt

---

## ✅ Complete Fix (Step by Step)

### **Step 1: Diagnose the Issue**

Run `debug-invitation-issue.sql` in Supabase SQL Editor to see what's wrong:

```sql
-- This will show:
-- ✅ If invitation is valid
-- ✅ If user already exists
-- ✅ If profile already exists
-- ✅ If trigger is enabled
```

---

### **Step 2: Clean Up Any Existing Data**

Run `cleanup-and-retry.sql` in Supabase SQL Editor:

```sql
-- This will:
-- 1. Delete any existing user/profile for your email
-- 2. Reset the invitation status to 'pending'
-- 3. Give you a fresh start
```

**⚠️ WARNING:** This deletes the user if it exists. Only run if you're stuck!

---

### **Step 3: Fix the Trigger**

Run `fix-invitation-trigger.sql` in Supabase SQL Editor:

```sql
-- This will:
-- 1. Recreate the trigger with better error handling
-- 2. Add case-insensitive email matching
-- 3. Add ON CONFLICT handling
-- 4. Add detailed logging
-- 5. Grant proper permissions
```

---

### **Step 4: Rebuild and Deploy**

```bash
# Rebuild the app with improved error messages
npm run build

# Or just restart dev server
npm run dev
```

---

### **Step 5: Try Creating Account Again**

1. Use your invitation URL:
   ```
   https://www.finestafrica.ai/invite/accept?token=kqqGzJIYOifXXQeg4Xt1cPK0bv6U-nAejw9ew0oUcMw
   ```

2. Enter a password (min 8 characters)

3. Submit

4. **Check your terminal/console** - you'll now see detailed logs:
   ```
   [API] Creating user account for: bhargavtelu101@gmail.com
   [API] User created successfully: [user-id]
   [API] Waiting for database trigger to create profile...
   [API] Checking if profile was created...
   [API] Profile query result: { profile: {...}, error: null }
   [API] Profile verified successfully. Role: admin
   ```

---

## 🔧 Quick Fix (If You're in a Hurry)

Just run these 3 commands in Supabase SQL Editor:

```sql
-- 1. Delete existing user/profile (if any)
DELETE FROM profiles WHERE email = 'bhargavtelu101@gmail.com';
DELETE FROM auth.users WHERE email = 'bhargavtelu101@gmail.com';

-- 2. Fix the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_invitation RECORD;
BEGIN
  SELECT * INTO valid_invitation
  FROM invitations
  WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF valid_invitation.id IS NOT NULL THEN
    INSERT INTO profiles (id, email, role, invited_by, invited_at, activated_at)
    VALUES (NEW.id, NEW.email, 'admin', valid_invitation.invited_by, valid_invitation.created_at, NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'admin', activated_at = NOW();
    
    UPDATE invitations
    SET status = 'accepted', accepted_at = NOW(), accepted_by = NEW.id
    WHERE id = valid_invitation.id;
  ELSE
    INSERT INTO profiles (id, email, role, invited_by)
    VALUES (NEW.id, NEW.email, 'pending_invite', NULL)
    ON CONFLICT (id) DO UPDATE SET role = 'pending_invite';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Reset invitation
UPDATE invitations 
SET status = 'pending', accepted_at = NULL, accepted_by = NULL
WHERE email = 'bhargavtelu101@gmail.com';

-- 4. Verify
SELECT '✅ Ready to try again!' as status;
```

Then try creating your account again!

---

## 🐛 Still Not Working?

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** → **Postgres Logs**
3. Look for trigger execution logs
4. Look for any errors or NOTICE messages

### Check RLS Policies

```sql
-- Verify RLS allows profile creation
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'profiles';

-- Should see policies allowing authenticated users to read profiles
```

### Manual Profile Creation (Last Resort)

If the trigger keeps failing, create the profile manually:

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'bhargavtelu101@gmail.com';

-- Then create profile manually (replace USER_ID)
INSERT INTO profiles (id, email, role, activated_at)
VALUES (
  'USER_ID_HERE',
  'bhargavtelu101@gmail.com',
  'admin',
  NOW()
);
```

---

## 📊 Verification Checklist

After fixing, verify everything works:

- [ ] Invitation status is 'pending' and not expired
- [ ] No existing user in `auth.users` for your email
- [ ] No existing profile in `profiles` for your email
- [ ] Trigger `on_auth_user_created` exists and is enabled
- [ ] Function `handle_new_user()` exists
- [ ] RLS policies allow profile creation and reading
- [ ] App rebuilt with improved error messages

---

## ✅ Success Indicators

You'll know it worked when:

1. ✅ No errors when submitting password
2. ✅ See "Account created successfully" message
3. ✅ Automatically redirected to `/admin`
4. ✅ Can see admin dashboard
5. ✅ Can invite other admins

---

## 🆘 Emergency Contact

If still stuck, check:

1. **Server logs** (terminal where `npm run dev` is running)
2. **Browser console** (F12 → Console tab)
3. **Supabase Postgres logs** (Dashboard → Logs)
4. **Network tab** (F12 → Network → Look for `/api/invite/accept` request)

The improved error messages will tell you exactly what's failing!

---

**Last Updated:** November 6, 2025
**Status:** Ready to use 🚀

