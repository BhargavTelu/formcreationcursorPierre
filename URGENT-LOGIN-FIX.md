# 🚨 URGENT: Fix Login Issue

## Problem
**Error**: "Unable to validate account access."  
**Cause**: The RLS (Row Level Security) policies I updated are blocking login

---

## ⚡ IMMEDIATE FIX (2 minutes)

### Step 1: Run Diagnostic
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy/paste contents of **`DIAGNOSE-LOGIN-ISSUE.sql`**
3. Click **Run**
4. **READ THE OUTPUT** - it will tell you exactly what's wrong

### Step 2: Run the Fix
1. In **Supabase SQL Editor**
2. Copy/paste contents of **`FIX-LOGIN-ISSUE.sql`**
3. Click **Run**
4. Should see "✅✅✅ LOGIN SHOULD NOW WORK!"

### Step 3: Try Login Again
1. Go to your admin login page
2. Try logging in
3. Should work now! ✅

---

## 🔍 What Went Wrong

The `FIX-INVITATION-SYSTEM.sql` script I created earlier included this line:

```sql
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
```

**FORCE ROW LEVEL SECURITY** is too strict - it blocks even legitimate queries during login. 

The login flow is:
1. User signs in → ✅ Works
2. System tries to read user's profile → ❌ **BLOCKED by FORCE RLS**
3. Error: "Unable to validate account access"

---

## 🛠️ What the Fix Does

`FIX-LOGIN-ISSUE.sql`:
1. ✅ Removes `FORCE ROW LEVEL SECURITY` (too strict)
2. ✅ Keeps regular RLS (still secure)
3. ✅ Updates RLS policies to allow users to read their own profile
4. ✅ Tests the fix automatically

---

## 🔎 Manual Diagnosis (If Fix Doesn't Work)

### Check Server Logs

Look in your terminal where `npm run dev` is running. Try logging in and look for:

```
[Auth] Failed to load profile during sign-in {
  error: { ... },
  message: "...",
  code: "...",
  ...
}
```

### Common Issues:

| Issue | Fix |
|-------|-----|
| "new row violates row-level security policy" | Run `FIX-LOGIN-ISSUE.sql` |
| "PGRST301" or "permission denied" | RLS policy blocking access |
| "No profile found" | User has no profile in profiles table |
| Empty profileRows array | User profile doesn't exist |

---

## 🆘 If Still Not Working

### Option 1: Temporarily Disable RLS on Profiles (TESTING ONLY!)

```sql
-- ⚠️ TESTING ONLY - Makes your app insecure!
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

Try logging in. If it works, the issue is definitely RLS policies.

Then re-enable RLS and fix policies:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Then run FIX-LOGIN-ISSUE.sql
```

### Option 2: Check if Profile Exists

```sql
-- Check if your admin user has a profile
SELECT 
  u.email AS user_email,
  p.email AS profile_email,
  p.role,
  p.id IS NOT NULL AS has_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';  -- Replace with your email
```

If `has_profile` is `false`, create a profile:

```sql
-- Create missing profile
INSERT INTO public.profiles (id, email, role, activated_at, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'admin',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- Replace with your email
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);
```

### Option 3: Check Detailed Error

With my enhanced logging, check your server console for this detailed error:

```
[Auth] Failed to load profile during sign-in {
  error: ...,
  message: "...",  ← READ THIS
  code: "...",
  hint: "...",
  userId: "...",
  userEmail: "..."
}
```

The `message` and `code` will tell you exactly what's wrong.

---

## 📊 Verification

After running the fix, verify it worked:

```sql
-- Test query that simulates login
-- Replace the email with your admin email
SELECT 
  p.email,
  p.role,
  'Profile read successfully!' AS result
FROM public.profiles p
WHERE p.email = 'your-email@example.com';
```

Should return your profile. If you get an error, RLS is still blocking.

---

## 🎯 Prevention

For future reference, the correct RLS setup for profiles should be:

```sql
-- ✅ CORRECT: Allow users to view their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ✅ CORRECT: Regular RLS (not FORCE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ❌ WRONG: FORCE is too strict for most use cases
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
```

---

## ⏱️ Quick Summary

1. **Run**: `DIAGNOSE-LOGIN-ISSUE.sql` → See what's wrong
2. **Run**: `FIX-LOGIN-ISSUE.sql` → Fix the RLS policies  
3. **Test**: Try logging in again
4. **Success**: Should work now! ✅

**If not working after this**, share:
- Output from `DIAGNOSE-LOGIN-ISSUE.sql`
- Server console error with detailed logging
- Your admin user email

---

## 💡 Why This Happened

I included `FORCE ROW LEVEL SECURITY` in the original fix to ensure maximum security, but it was too aggressive. The standard `ENABLE ROW LEVEL SECURITY` is secure enough and doesn't block legitimate queries.

**Lesson**: `FORCE RLS` should only be used in very specific cases where you need to block even the table owner. For normal apps, regular RLS is sufficient.

---

**Start with running `FIX-LOGIN-ISSUE.sql` - it should fix it in 2 minutes!** 🚀

