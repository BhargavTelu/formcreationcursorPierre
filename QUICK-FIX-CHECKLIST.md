# ⚡ Quick Fix Checklist - Admin Invitation Issue

## 🎯 Your Error
**"Unable to create administrator account."**

---

## ✅ What I've Already Fixed

1. ✅ **Deleted broken duplicate page** - `/app/admin/accept-invitation/page.tsx`
2. ✅ **Added detailed error logging** - Now you'll see exactly what's failing
3. ✅ **Created fix scripts** - SQL scripts to repair your database

---

## 🚨 MOST LIKELY CAUSE

### Missing Service Role Key ⚠️

**Check your `.env.local` file NOW:**

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If this is missing or empty → THIS IS YOUR PROBLEM!**

**How to fix:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **`service_role` key** (secret, keep it safe!)
5. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=paste_the_key_here
   ```
6. **Restart your dev server**: Stop (Ctrl+C) and run `npm run dev` again

---

## 🔧 5-Minute Fix Process

### Step 1: Environment Variables (2 min)
```bash
# Check if these are in your .env.local file:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← MOST IMPORTANT!
```

### Step 2: Run Database Fix (2 min)
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste content of `FIX-INVITATION-SYSTEM.sql`
3. Click **Run**
4. Wait for "✅ INVITATION SYSTEM FIXED"

### Step 3: Restart & Test (1 min)
```bash
# Stop your server
Ctrl + C

# Start it again
npm run dev
```

### Step 4: Try Invitation Again
1. Send new invitation from admin panel
2. Open invitation link (should be `/invite/accept?token=xxx`)
3. Set password
4. Should work! ✨

---

## 🐛 If Still Not Working

### See the detailed error:

1. **Open your terminal** where `npm run dev` is running
2. **Try accepting invitation again**
3. **Look for this line** in the console:

```
[Invite] Failed to create user { error: ..., message: "...", ... }
```

4. **Read the message** - it will tell you exactly what's wrong

### Common errors and fixes:

| Error Message | Fix |
|---------------|-----|
| "Missing SUPABASE_SERVICE_ROLE_KEY" | Add the service role key to `.env.local` |
| "User already exists" | Delete user from Supabase Dashboard → Authentication → Users |
| "Permission denied" | Run `FIX-INVITATION-SYSTEM.sql` |
| "Invalid token" | Token expired, send new invitation |

---

## 📋 Complete File List

I created these files for you:

1. **`INVITATION-TROUBLESHOOTING-GUIDE.md`** ← Read this for full details
2. **`INVITATION-DIAGNOSTIC.sql`** ← Run this to diagnose issues
3. **`FIX-INVITATION-SYSTEM.sql`** ← Run this to fix database
4. **`TEST-INVITATION-FLOW.sql`** ← Run this to test the system
5. **`QUICK-FIX-CHECKLIST.md`** ← This file (quick reference)

---

## 🎯 Expected Flow (When Working)

```
1. Admin sends invitation
   ↓
2. Email sent to user with link: /invite/accept?token=xxx
   ↓
3. User clicks link and sees form
   ↓
4. User enters password (min 12 chars)
   ↓
5. API calls: /api/invite/accept
   ↓
6. Creates user in Supabase Auth
   ↓
7. Trigger creates profile with role='admin'
   ↓
8. User logged in automatically
   ↓
9. Redirected to /admin/dashboard
   ✅ SUCCESS!
```

---

## 🆘 Still Stuck?

Run the diagnostic and share the output:

```bash
# In Supabase SQL Editor, run:
# Contents of INVITATION-DIAGNOSTIC.sql

# Then share:
# - The diagnostic output
# - Server console errors
# - Which step fails
```

---

## 💡 Pro Tips

- Always use **private/incognito window** when testing invitations
- Check **both** server console (terminal) and browser console (F12)
- Service role key should be **~200 characters long** (if it's short, it's wrong)
- Invitation links expire in **48 hours** by default
- Each invitation can only be used **once**

---

## ✨ Success Checklist

After fixing, you should see:

- [ ] No errors in terminal when accepting invitation
- [ ] User appears in Supabase → Authentication → Users
- [ ] Profile appears in Supabase → Database → profiles (role='admin')
- [ ] Invitation status changed to 'accepted' in invitations table
- [ ] User can log in at `/admin` with new credentials
- [ ] User can access `/admin/dashboard`

---

**Start with Step 1 above - checking the service role key!** This fixes 80% of cases. 🎯

