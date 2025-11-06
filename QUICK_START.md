# Quick Start - Admin RBAC System

Get your secure admin invitation system up and running in 5 minutes!

---

## ⚡ Quick Setup (5 Steps)

### 1️⃣ Run Database Migration

```bash
# Copy this SQL file to Supabase Dashboard → SQL Editor → Run
supabase-rbac-migration.sql
```

### 2️⃣ Create Your First Admin

**Option A**: Via SQL (Recommended)
```sql
-- In Supabase SQL Editor
INSERT INTO invitations (email, token, invited_by, status, expires_at)
VALUES (
  'your-email@example.com',
  generate_invitation_token(),
  '00000000-0000-0000-0000-000000000000',
  'pending',
  NOW() + INTERVAL '30 days'
);

-- Get your token
SELECT token FROM invitations WHERE email = 'your-email@example.com' ORDER BY created_at DESC LIMIT 1;
```

**Option B**: Manual upgrade (if you already have an account)
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3️⃣ Disable Public Sign-Up

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. **Uncheck** "Enable email sign-up"
4. Keep "Enable email sign-in" **checked** ✅
5. Save

### 4️⃣ Configure Environment

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai

# Optional: Email service (for production)
RESEND_API_KEY=re_xxxxx
```

### 5️⃣ Deploy & Test

```bash
npm install
npm run dev
```

Visit: `http://localhost:3000/admin`

---

## 🎯 Usage

### Invite a New Admin

1. Sign in at `/admin`
2. Click **"Invite Admin"** (top right)
3. Enter email → Send
4. Share invitation link (or they'll get email)

### Accept Invitation

1. Click invitation link
2. Set password
3. Done! You're an admin 🎉

---

## 🧪 Test It Works

```bash
# 1. Try accessing admin page without login
curl http://localhost:3000/admin/invite
# → Should redirect to /admin

# 2. Try sending invite without admin role
curl -X POST http://localhost:3000/api/admin/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# → Should return 401 Unauthorized

# 3. Verify invitation token endpoint works
curl http://localhost:3000/api/invite/verify?token=invalid
# → Should return {"valid":false,"error":"Invalid invitation token"}
```

---

## 🔧 Common Issues

### "No profiles table exists"
→ Run migration file in Supabase SQL Editor

### "Can't access /admin/invite"
→ Check your role:
```sql
SELECT role FROM profiles WHERE email = 'your@email.com';
-- If not 'admin', run:
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### "Email not sending"
→ Check console in dev mode - invitation URL is logged there

---

## 📁 File Structure

```
├── app/
│   ├── admin/
│   │   ├── page.tsx                 # Admin dashboard
│   │   └── invite/
│   │       └── page.tsx             # Invite management
│   ├── invite/
│   │   └── accept/
│   │       └── page.tsx             # Accept invitation
│   └── api/
│       ├── admin/
│       │   └── invite/
│       │       └── route.ts         # Invite API (protected)
│       └── invite/
│           ├── verify/
│           │   └── route.ts         # Verify token (public)
│           └── accept/
│               └── route.ts         # Accept invitation (public)
├── lib/
│   ├── auth.ts                      # RBAC utilities
│   ├── email.ts                     # Email service
│   └── supabase.ts                  # Supabase clients
├── components/
│   └── AdminAuth.tsx                # Sign-in component (no sign-up)
├── middleware.ts                    # Route protection
└── supabase-rbac-migration.sql     # Database setup
```

---

## 🔒 Security Features

✅ **Invitation-only access** - No public sign-up
✅ **Role-based access control** - Admin vs pending_invite
✅ **Row Level Security** - Database-level protection
✅ **One-time tokens** - 7-day expiration
✅ **Middleware protection** - Route-level guards
✅ **Secure tokens** - 256-bit cryptographic random

---

## 📚 Full Documentation

- [Complete Setup Guide](./ADMIN_RBAC_SETUP.md) - Detailed instructions
- [Architecture](./ARCHITECTURE.md) - System design & data flow
- [Troubleshooting](./ADMIN_RBAC_SETUP.md#-troubleshooting) - Common issues

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] Database migration completed
- [ ] First admin user created and tested
- [ ] Public sign-up disabled in Supabase
- [ ] Environment variables set in production
- [ ] Email service configured (optional but recommended)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Invitation flow tested end-to-end
- [ ] Non-admin access blocked (test with different account)

---

## 🆘 Need Help?

1. Check [Troubleshooting Guide](./ADMIN_RBAC_SETUP.md#-troubleshooting)
2. Review [Architecture Docs](./ARCHITECTURE.md)
3. Check Supabase Dashboard → Logs
4. Verify RLS policies are enabled

---

**🚀 You're all set!** Your admin system is now secure and production-ready.

