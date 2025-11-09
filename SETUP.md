# 🚀 Admin System Setup Guide

## Overview

This is a secure, invite-only admin system for Finest Africa travel planning platform.

### Features
- ✅ Admin-only access (no public signup)
- ✅ Role-based access control (admin role)
- ✅ Email invitation system with expiring tokens
- ✅ HTTP-only cookie authentication
- ✅ Row Level Security (RLS) policies

---

## 📋 Prerequisites

- Supabase project created
- Next.js application set up
- Node.js installed

---

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URLs
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai
NEXT_PUBLIC_APP_URL=https://www.finestafrica.ai

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
INVITE_EMAIL_FROM="Finest Africa <admin@finestafrica.ai>"

# Bootstrap Secret (for creating first admin)
BOOTSTRAP_SECRET=your-random-64-char-hex-string
```

**Generate Bootstrap Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 2: Run Database Migration

1. Go to **Supabase Dashboard → SQL Editor**
2. Run `supabase-admin-security.sql`
3. Verify tables created:
   ```sql
   SELECT * FROM profiles;
   SELECT * FROM invitations;
   ```

---

### Step 3: Create First Admin User

1. Go to **Supabase Dashboard → SQL Editor**
2. Run `RECREATE-USER-COMPLETE.sql`
3. Update the email and password in the script
4. Verify user created:
   ```sql
   SELECT * FROM auth.users WHERE email = 'your-email@example.com';
   SELECT * FROM profiles WHERE email = 'your-email@example.com';
   ```

---

### Step 4: Test Login

1. Start dev server: `npm run dev`
2. Go to: http://localhost:3000/login
3. Log in with your admin credentials
4. You should be redirected to `/admin/dashboard`

---

### Step 5: Invite Other Admins

1. Go to: http://localhost:3000/admin/invite
2. Enter email address
3. Click "Send Invite"
4. The invitee will receive an email with a magic link
5. They can set their password and gain admin access

---

## 🗄️ Database Schema

### `profiles` Table
Stores user profiles with roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | User ID (FK to auth.users) |
| `email` | TEXT | User email |
| `role` | TEXT | 'admin' or 'pending_invite' |
| `invited_by` | UUID | Admin who invited this user |
| `invited_at` | TIMESTAMPTZ | When invited |
| `activated_at` | TIMESTAMPTZ | When activated |

### `invitations` Table
Tracks invitation tokens and status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Invitation ID |
| `email` | TEXT | Email to invite |
| `token_hash` | TEXT | Hashed invitation token |
| `status` | TEXT | 'pending', 'accepted', 'expired', 'revoked' |
| `invited_by` | UUID | Admin who sent invite |
| `invited_at` | TIMESTAMPTZ | When first invited |
| `last_sent_at` | TIMESTAMPTZ | Last email sent |
| `expires_at` | TIMESTAMPTZ | Expiration (48 hours) |
| `accepted_at` | TIMESTAMPTZ | When accepted |

---

## 🔐 Security Features

### 1. Row Level Security (RLS)
- Users can only view their own profile
- Admins can view and manage all profiles
- Admins can manage all invitations

### 2. HTTP-Only Cookies
- Session tokens stored in HTTP-only cookies
- Not accessible via JavaScript
- Secure in production (HTTPS only)

### 3. Invitation Tokens
- Cryptographically secure random tokens
- Hashed before storage (SHA-256)
- Expire after 48 hours

### 4. No Public Signup
- All users must be invited by an admin
- Email/password signup disabled in Supabase

---

## 📁 Key Files

### Backend
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/admin/invitations/route.ts` - Invitation management
- `app/api/invite/accept/route.ts` - Accept invitation
- `lib/auth.ts` - Authentication helpers
- `lib/invitations.ts` - Invitation token generation

### Frontend
- `app/login/page.tsx` - Login page
- `app/(admin-protected)/admin/layout.tsx` - Admin layout with auth check
- `app/(admin-protected)/admin/dashboard/page.tsx` - Admin dashboard
- `app/(admin-protected)/admin/invite/page.tsx` - Send invitations
- `components/AdminAuth.tsx` - Login form component

### Database
- `supabase-admin-security.sql` - Main schema migration
- `RECREATE-USER-COMPLETE.sql` - Create admin user manually
- `re-enable-trigger.sql` - Re-enable trigger after bootstrap

---

## 🚀 Production Deployment

### Vercel Environment Variables

Set these in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai
NEXT_PUBLIC_APP_URL=https://www.finestafrica.ai
RESEND_API_KEY=your-resend-key
INVITE_EMAIL_FROM="Finest Africa <admin@finestafrica.ai>"
```

### Supabase Configuration

1. **Disable Public Signup**:
   - Go to: Authentication → Providers → Email
   - Disable "Enable email signup"

2. **Configure Site URL**:
   - Go to: Authentication → URL Configuration
   - Site URL: `https://www.finestafrica.ai`
   - Redirect URLs: `https://www.finestafrica.ai/**`

3. **Enable RLS**:
   - Ensure RLS is enabled on `profiles` and `invitations` tables

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YourPassword123"}'
```

### Test Invitation
```bash
curl -X POST http://localhost:3000/api/admin/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{"email":"newadmin@example.com"}'
```

---

## 🐛 Troubleshooting

### Login fails with "Database error"
- Check Supabase Postgres logs for errors
- Verify `profiles` table exists
- Ensure RLS policies are correct

### Invitation email not sent
- Check Resend API key is correct
- Verify `INVITE_EMAIL_FROM` is a verified domain
- Check Resend dashboard for delivery status

### "Unauthorized" after login
- Verify user has `role = 'admin'` in `profiles` table
- Check HTTP-only cookies are being set
- Ensure middleware is not blocking admin routes

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Resend Email API](https://resend.com/docs)

---

## ✅ Checklist

- [ ] Environment variables configured
- [ ] Database migration run
- [ ] First admin user created
- [ ] Login tested successfully
- [ ] Invitation system tested
- [ ] RLS policies verified
- [ ] Production environment variables set
- [ ] Public signup disabled in Supabase

