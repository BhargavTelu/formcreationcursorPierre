# Finest Africa - Form Creation & Admin System

A Next.js application for managing travel submissions and admin invitations with Supabase backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- (Optional) Resend account for email invitations

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run database setup
# Go to Supabase Dashboard → SQL Editor
# Run: supabase-admin-security.sql

# 4. Start development server
npm run dev
```

Visit: `http://localhost:3000`

---

## 📁 Project Structure

```
formcreationcursor/
├── app/                          # Next.js app directory
│   ├── (admin-protected)/       # Protected admin routes
│   │   └── admin/
│   │       ├── dashboard/       # Admin dashboard
│   │       ├── invite/          # Send invitations
│   │       └── layout.tsx       # Admin layout with auth
│   ├── (public-admin)/          # Public admin routes
│   │   └── admin/sign-in/       # Admin sign-in page
│   ├── agency/[subdomain]/      # Agency-specific pages
│   ├── api/                     # API routes
│   │   ├── admin/              # Admin management APIs
│   │   ├── auth/               # Authentication APIs
│   │   └── invite/             # Invitation APIs
│   ├── invite/accept/          # Accept invitation page
│   └── login/                  # Login page
├── components/                  # React components
│   ├── ui/                     # UI components
│   ├── AcceptInviteForm.tsx   # Invitation acceptance
│   ├── AdminAuth.tsx          # Admin authentication
│   ├── AgencyForm.tsx         # Agency form
│   └── ...
├── lib/                        # Utility libraries
│   ├── auth.ts                # Authentication helpers
│   ├── email.ts               # Email sending
│   ├── invitations.ts         # Invitation utilities
│   └── supabase.ts            # Supabase client
├── scripts/                    # Utility scripts
├── supabase-admin-security.sql # Initial DB setup
├── FINAL-FIX.sql              # Login system fix
└── FIX-INVITATION-TRIGGER.sql # Invitation system fix
```

---

## 🔐 Authentication & Authorization

### Admin Authentication Flow

```
1. Admin logs in → /login
2. Credentials verified → Supabase Auth
3. Profile checked → Must have role='admin'
4. Session created → Cookies set
5. Redirected → /admin/dashboard
```

### Invitation System Flow

```
1. Admin sends invite → Creates invitation record + sends email
2. User clicks link → /invite/accept?token=xxx
3. User sets password → Creates auth.users record
4. Trigger fires → Creates admin profile automatically
5. User logged in → Redirected to dashboard
```

---

## 🗄️ Database Schema

### Key Tables

**`public.profiles`**
- Stores admin user profiles
- `role`: 'admin' or 'pending_invite'
- RLS policies ensure users can only see own data

**`public.invitations`**
- Stores invitation records
- `status`: 'pending', 'accepted', 'expired', or 'revoked'
- Token hashed for security

**`auth.users`** (Supabase managed)
- User authentication records
- Managed by Supabase Auth

### Database Triggers

**`handle_new_user()`**
- Fires when new user created
- Checks for pending invitation
- Creates appropriate profile (admin or pending_invite)

**`is_admin()`**
- Helper function for RLS policies
- Prevents infinite recursion
- Uses SECURITY DEFINER

---

## 🔧 Configuration

### Environment Variables

Required in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Required for admin operations

# Optional: Email Configuration
RESEND_API_KEY=re_...  # For sending invitation emails
INVITE_EMAIL_FROM=Admin <admin@finestafrica.ai>

# Optional: Custom App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Auto-detected in dev
```

### Supabase Setup

1. **Enable Email Provider**
   - Go to Authentication → Providers
   - Enable Email provider
   - Disable "Confirm email" (handled programmatically)

2. **Run SQL Scripts** (in order)
   ```sql
   -- 1. Initial setup
   supabase-admin-security.sql

   -- 2. Fix login system (if needed)
   FINAL-FIX.sql

   -- 3. Fix invitation system (if needed)
   FIX-INVITATION-TRIGGER.sql
   ```

---

## 🎯 Key Features

### Admin Dashboard
- View and manage submissions
- Invite new administrators
- Manage agencies

### Invitation System
- Secure token-based invitations
- Email delivery (optional)
- 48-hour expiration
- One-time use tokens

### Agency Management
- Subdomain-based routing
- Custom agency pages
- Form submissions

---

## 🐛 Troubleshooting

### Login Issues

**Error**: "Unable to validate account access"

**Solution**:
1. Run `FINAL-FIX.sql` in Supabase SQL Editor
2. Restart dev server
3. Try logging in again

### Invitation Issues

**Error**: "Unable to create administrator account"

**Solution**:
1. Check SUPABASE_SERVICE_ROLE_KEY is set
2. Run `FIX-INVITATION-TRIGGER.sql` in Supabase
3. Restart dev server
4. Send fresh invitation

### Common Issues

| Issue | Solution |
|-------|----------|
| Wrong invitation URL domain | Check NEXT_PUBLIC_APP_URL in .env.local |
| Infinite recursion error | Run FINAL-FIX.sql |
| User exists but no profile | Run FIX-INVITATION-TRIGGER.sql |
| RLS policy errors | Verify policies with diagnostic scripts |

---

## 📚 Additional Documentation

- **ENV_SETUP.md** - Environment setup guide
- **SETUP.md** - Detailed setup instructions
- **TESTING.md** - Testing guide
- **PRODUCTION_CHECKLIST.md** - Pre-deployment checklist
- **SUBDOMAIN_SETUP.md** - Subdomain configuration
- **DESTINATION_TREE_README.md** - Destination tree component

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

### Database Scripts

Located in project root:

- **`supabase-admin-security.sql`** - Initial database setup
- **`FINAL-FIX.sql`** - Login system RLS policies
- **`FIX-INVITATION-TRIGGER.sql`** - Invitation trigger setup

### Helper Scripts

Located in `/scripts`:

- **`setup-super-admin.js`** - Create initial super admin
- **`create-test-agencies.js`** - Create test data

---

## 🔒 Security

### Best Practices

1. **Environment Variables**
   - Never commit `.env.local`
   - Keep service role key secure
   - Rotate keys periodically

2. **Database Security**
   - RLS policies enforced on all tables
   - Service role bypasses RLS (admin operations only)
   - Passwords hashed by Supabase

3. **Invitation Security**
   - Tokens hashed in database
   - 48-hour expiration
   - One-time use only
   - Email validation

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Run all database scripts in production Supabase
- [ ] Set all environment variables
- [ ] Test login system
- [ ] Test invitation system
- [ ] Configure custom domain (if applicable)
- [ ] Set up email service (Resend)
- [ ] Review RLS policies
- [ ] Test with production data

See **PRODUCTION_CHECKLIST.md** for detailed checklist.

---

## 📝 License

[Your License Here]

---

## 🤝 Support

For issues or questions:
1. Check troubleshooting section above
2. Review documentation files
3. Check Supabase dashboard for errors
4. Review server logs

---

## 🔄 Recent Changes

- ✅ Fixed infinite recursion in RLS policies
- ✅ Fixed invitation URL generation for development
- ✅ Enhanced error logging for debugging
- ✅ Cleaned up duplicate files and components
- ✅ Consolidated documentation

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-09

