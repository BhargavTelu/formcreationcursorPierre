# Admin RBAC & Invitation System - Setup Guide

## 🔒 Security Lockdown Complete

This guide will walk you through setting up the production-grade admin invitation system with Role-Based Access Control (RBAC).

---

## ✅ What Was Implemented

### 1. **Database Layer**
- ✅ `profiles` table with role-based access (`admin`, `pending_invite`)
- ✅ `invitations` table with secure token management
- ✅ Row Level Security (RLS) policies for all admin operations
- ✅ Database triggers for automatic profile creation
- ✅ Helper functions for invitation validation

### 2. **Backend/API**
- ✅ `/api/admin/invite` - Send invitations (admin only)
- ✅ `/api/invite/verify` - Verify invitation tokens (public)
- ✅ `/api/invite/accept` - Accept invitation & create account (public)
- ✅ Role checking utilities in `lib/auth.ts`
- ✅ Email service with multiple provider support in `lib/email.ts`

### 3. **Frontend**
- ✅ `/admin/invite` - Admin invitation management page
- ✅ `/invite/accept?token=xxx` - Invitation acceptance page
- ✅ Updated admin dashboard with invite button
- ✅ Removed public sign-up from authentication

### 4. **Security**
- ✅ Middleware protection for admin routes
- ✅ Admin role verification on all sensitive operations
- ✅ Secure token generation (32-byte cryptographic random)
- ✅ One-time use invitations with 7-day expiration
- ✅ Invitation revocation capability

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Run the migration file: `supabase-rbac-migration.sql`

```bash
# The migration will create:
# - profiles table
# - invitations table
# - RLS policies
# - Triggers
# - Helper functions
```

### Step 2: Bootstrap First Admin User

You have **3 options** to create your first admin:

#### Option A: Create Invitation in Database (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Create invitation for first admin
INSERT INTO invitations (email, token, invited_by, status, expires_at)
VALUES (
  'your-email@example.com',              -- Replace with your email
  generate_invitation_token(),
  '00000000-0000-0000-0000-000000000000', -- System invitation
  'pending',
  NOW() + INTERVAL '30 days'
);

-- Get the invitation token
SELECT token FROM invitations WHERE email = 'your-email@example.com' ORDER BY created_at DESC LIMIT 1;
```

Then visit: `https://yourdomain.com/invite/accept?token=GENERATED_TOKEN`

#### Option B: Manually Upgrade Existing User

If you already have a user account:

```sql
UPDATE profiles 
SET role = 'admin', activated_at = NOW() 
WHERE email = 'your-email@example.com';
```

#### Option C: Temporary Development Access

For development only, you can temporarily disable RLS:

```sql
-- WARNING: Development only!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Sign up normally
-- Then manually set role to admin
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Step 3: Configure Email Service (Optional but Recommended)

Choose one email provider:

#### Option 1: Resend (Recommended)

```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### Option 2: SendGrid

```bash
# .env.local
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

#### Option 3: Supabase Edge Function

Create edge function:
```bash
supabase functions new send-invitation-email
```

**Development Mode**: If no email service is configured, invitation links are logged to console.

### Step 4: Disable Supabase Public Sign-Up

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Email** provider
4. **Uncheck** "Enable email sign-up"
5. Keep "Enable email sign-in" **checked** ✅
6. Save changes

This prevents public registration while allowing invited users to sign in.

### Step 5: Update Environment Variables

```bash
# .env.local

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Domain (required)
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai

# Email Service (optional - choose one)
RESEND_API_KEY=re_xxxxxxxxxxxxx
# OR
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### Step 6: Deploy & Test

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🎯 Usage Guide

### For Admins: Inviting New Users

1. **Sign in** to admin dashboard at `/admin`
2. Click **"Invite Admin"** button (top right)
3. Enter the email address of the person you want to invite
4. Click **"Send Invitation"**
5. User receives email with secure link (or you share the link manually in dev mode)

### For Invited Users: Accepting Invitations

1. **Click the invitation link** in email (or paste link in browser)
2. Verify your email is correct
3. **Set a secure password** (min 8 characters)
4. Click **"Accept Invitation & Create Account"**
5. You're automatically signed in with admin access

### Managing Invitations

- **View all invitations**: Go to `/admin/invite`
- **Revoke pending invitations**: Click "Revoke" next to any pending invitation
- **Check invitation status**: See accepted, pending, expired, or revoked states
- **Refresh list**: Click "Refresh" button to update invitation list

---

## 🔐 Security Features

### Token Security
- **32-byte cryptographic random** tokens
- **One-time use** - token invalidated after acceptance
- **7-day expiration** - automatic cleanup
- **Secure transmission** - HTTPS only

### Access Control
- **Admin-only invitation sending** - enforced by RLS policies
- **Role verification** - middleware checks on all admin routes
- **No public sign-up** - invitation-only access
- **Automatic role assignment** - database triggers

### Database Security
- **Row Level Security (RLS)** enabled on all tables
- **Authenticated-only access** to profiles
- **Admin-only access** to create/update sensitive data
- **Public read-only** for agencies (needed for subdomain routing)

---

## 🧪 Testing

### Test Invitation Flow (Development)

1. Start dev server: `npm run dev`
2. Sign in as admin at `http://localhost:3000/admin`
3. Go to `http://localhost:3000/admin/invite`
4. Enter test email: `test@example.com`
5. Check console for invitation URL
6. Open invitation URL in incognito window
7. Set password and create account
8. Verify new admin can access dashboard

### Test Security

```bash
# Test 1: Try accessing /admin/invite without auth
curl http://localhost:3000/admin/invite
# Should redirect to /admin

# Test 2: Try creating invitation without admin role
curl -X POST http://localhost:3000/api/admin/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@example.com"}'
# Should return 401/403

# Test 3: Try using expired/invalid token
curl http://localhost:3000/api/invite/verify?token=invalid
# Should return {"valid":false,"error":"Invalid invitation token"}
```

---

## 🚨 Troubleshooting

### Issue: "No profiles table exists"

**Solution**: Run the migration file `supabase-rbac-migration.sql` in Supabase SQL Editor.

### Issue: "User created but not admin"

**Solution**: Check that:
1. Valid invitation exists before signup
2. Database trigger `handle_new_user()` is enabled
3. Run: `SELECT * FROM invitations WHERE email = 'user@example.com';`

### Issue: "Email not sending"

**Solution**: 
1. Check email service API key in `.env.local`
2. In development, check console for invitation URL
3. Verify email provider is configured correctly
4. For testing, manually share the invitation URL

### Issue: "Invitation token invalid"

**Solution**: 
1. Check token hasn't expired (7 days)
2. Verify token hasn't been used already
3. Check invitation status: `SELECT status FROM invitations WHERE token = 'xxx';`

### Issue: "Can't access /admin/invite"

**Solution**:
1. Verify you're signed in
2. Check your role: `SELECT role FROM profiles WHERE email = 'your-email@example.com';`
3. If not admin, manually upgrade: `UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';`

---

## 📊 Monitoring & Maintenance

### Check Admin Stats

```sql
-- Get admin dashboard statistics
SELECT * FROM admin_dashboard_stats;

-- List all admins
SELECT email, activated_at, last_sign_in_at 
FROM profiles 
WHERE role = 'admin' 
ORDER BY created_at DESC;

-- Check pending invitations
SELECT email, expires_at, created_at 
FROM invitations 
WHERE status = 'pending' AND expires_at > NOW();
```

### Cleanup Old Invitations

```sql
-- Manually expire old invitations
SELECT expire_old_invitations();

-- Or set up a scheduled job (Supabase cron extension)
```

### Audit Trail

```sql
-- View invitation history
SELECT 
  i.email,
  i.status,
  i.created_at,
  i.accepted_at,
  p_inviter.email as invited_by_email,
  p_accepted.email as accepted_by_email
FROM invitations i
LEFT JOIN profiles p_inviter ON i.invited_by = p_inviter.id
LEFT JOIN profiles p_accepted ON i.accepted_by = p_accepted.id
ORDER BY i.created_at DESC;
```

---

## 🔄 Migration from Old System

If you had public sign-up before:

1. **Identify existing admins**:
```sql
SELECT id, email FROM auth.users;
```

2. **Manually grant admin role**:
```sql
-- For each existing admin
INSERT INTO profiles (id, email, role, activated_at)
VALUES (
  'user-uuid-here',
  'admin@example.com',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'admin', activated_at = NOW();
```

3. **Lock down non-admin users**:
```sql
-- Set all other users to pending_invite
UPDATE profiles SET role = 'pending_invite' WHERE role IS NULL OR role != 'admin';
```

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## ✅ Security Checklist

Before going to production:

- [ ] Database migration completed
- [ ] First admin user created
- [ ] Public sign-up disabled in Supabase
- [ ] Email service configured and tested
- [ ] Environment variables set in production
- [ ] Middleware protection verified
- [ ] RLS policies enabled on all tables
- [ ] Invitation flow tested end-to-end
- [ ] Access control verified (try accessing as non-admin)
- [ ] HTTPS enabled (required for secure cookies)

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for client-side errors
4. Review server logs for API errors
5. Verify database triggers are working: `SELECT * FROM pg_trigger;`

---

**🎉 Congratulations!** Your admin system is now secured with production-grade RBAC and invitation-only access.

