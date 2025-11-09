# ⚡ FIX INVITATION - DO THIS NOW

## 🎯 **Your Problem**
- Invitation link: `https://www.finestafrica.ai/...` (wrong domain!)
- Error: "Unable to create administrator account"

## ✅ **The Solution (3 Minutes)**

### 1️⃣ Restart Dev Server (10 seconds)
```bash
# In your terminal:
Ctrl + C
npm run dev
```
**Why**: Code fix needs restart

### 2️⃣ Fix Database (1 minute)
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy ALL from file: **`FIX-INVITATION-TRIGGER.sql`**
3. Paste and click **RUN**
4. See: "✅ Invitation acceptance should work now!"

**Why**: Creates trigger to make profiles

### 3️⃣ Test (2 minutes)
1. Go to: `http://localhost:3000/admin/invite`
2. Send **NEW** invitation
3. URL should NOW be: `http://localhost:3000/invite/accept?token=...`
   - ✅ **localhost** (not finestafrica.ai!)
4. Open URL in private window
5. Set password
6. **Works!** ✅

---

## 📊 **What I Fixed**

### Code (lib/email.ts) - Already Done:
```javascript
// Now detects development automatically:
if (NODE_ENV === 'development') {
  return 'http://localhost:3000';  ← Uses localhost now!
}
```

### Database - You Need to Run:
- Creates trigger that makes admin profiles
- Without this, users get created but no profile
- That's why you get "Unable to create administrator account"

---

## ✅ **Success Checklist**

After restart:
- [ ] Terminal shows "Ready in X.Xs"

After database fix:
- [ ] Supabase shows "✅ Trigger installed"

After sending invitation:
- [ ] URL shows `localhost:3000` (not finestafrica.ai)

After accepting:
- [ ] Terminal shows `POST /api/invite/accept 200`
- [ ] Browser redirects to dashboard
- [ ] No errors!

---

## 🛡️ **Will This Break Login?**

**NO!** ✅
- These fixes are separate from login
- Login uses RLS policies (already fixed)
- Invitations use database trigger (fixing now)
- No conflicts!

---

## 🆘 **Still Issues?**

### URL still wrong after restart:
- Make sure server fully restarted
- Send a **new** invitation (old ones cached)

### "Unable to create administrator account":
- Did you run `FIX-INVITATION-TRIGGER.sql`?
- Check Supabase for success message

### Need more help:
- Read `FIX-INVITATION-COMPLETE.md` for full guide
- Run `CHECK-INVITATION-SYSTEM.sql` to diagnose
- Share terminal errors with me

---

## ⏱️ **Summary**

| Step | Action | Time |
|------|--------|------|
| 1 | Restart: `Ctrl+C` then `npm run dev` | 10s |
| 2 | Supabase: Run `FIX-INVITATION-TRIGGER.sql` | 1m |
| 3 | Test: Send & accept invitation | 2m |

**Total: ~3 minutes** ⏱️

---

**DO THIS NOW:**
1. Terminal → Ctrl+C → npm run dev
2. Supabase → Run FIX-INVITATION-TRIGGER.sql
3. Test invitation

🚀 **Then it will work!** 🚀

