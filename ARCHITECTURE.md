# Admin RBAC System - Architecture Documentation

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  /admin (login) | /admin/invite | /invite/accept?token=xxx  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Middleware                         │
│  - Admin route protection (/admin/*)                        │
│  - Role verification via Supabase                           │
│  - Security headers                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │
        ┌───────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│   API Routes     │            │   Page Routes    │
│                  │            │                  │
│ /api/admin/      │            │ /admin           │
│ - invite (CRUD)  │            │ /admin/invite    │
│                  │            │ /invite/accept   │
│ /api/invite/     │            │ /agency/[sub]    │
│ - verify         │            └──────────────────┘
│ - accept         │
└────────┬─────────┘
         │
         │ Supabase Client
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth.Users │  │   Profiles   │  │  Invitations │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ id (PK)      │◄─┤ id (FK)      │  │ id (PK)      │     │
│  │ email        │  │ email        │  │ email        │     │
│  │ encrypted_pw │  │ role         │  │ token        │     │
│  │ created_at   │  │ invited_by   │  │ invited_by   │     │
│  └──────────────┘  │ activated_at │  │ status       │     │
│                    │ metadata     │  │ expires_at   │     │
│                    └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Row Level Security (RLS)                    │  │
│  │  - Profiles: User sees own, admins see all          │  │
│  │  - Invitations: Admins only (+ public token verify)  │  │
│  │  - Agencies: Admins only for write                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Database Triggers                           │  │
│  │  - on_auth_user_created(): Auto-create profile      │  │
│  │  - update_updated_at_column(): Timestamp updates    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
         │ Optional
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Service                             │
│  Resend | SendGrid | Supabase Edge Function                │
│  - Send invitation emails with secure links                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown

### 1. Database Layer

#### Tables

**`profiles`**
- Primary user metadata table
- Links to `auth.users` via foreign key
- Stores role, invitation metadata
- RLS enabled for access control

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  role text CHECK (role IN ('admin', 'pending_invite')),
  invited_by uuid REFERENCES auth.users(id),
  activated_at timestamptz,
  ...
);
```

**`invitations`**
- Manages invitation lifecycle
- Secure token storage
- Expiration and status tracking
- One-time use enforcement

```sql
CREATE TABLE invitations (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz,
  ...
);
```

#### RLS Policies

**Profiles**
- ✅ Users can view their own profile
- ✅ Admins can view all profiles
- ✅ Users can update own metadata (but not role)
- ❌ Only triggers can set role

**Invitations**
- ✅ Admins can CRUD invitations
- ✅ Public can verify by token (SELECT only)
- ❌ Non-admins cannot create/update

**Agencies**
- ✅ Public can read (needed for subdomain routing)
- ✅ Admins only can create/update
- ❌ Non-admins cannot modify

#### Triggers

**`on_auth_user_created`**
- Fires when user signs up
- Checks for valid invitation
- Creates profile with appropriate role
- Marks invitation as accepted

**`update_updated_at_column`**
- Automatically updates `updated_at` timestamp
- Fires on any UPDATE to profiles/invitations

---

### 2. Backend Layer

#### API Routes

**`/api/admin/invite`** (Protected)
- `GET` - List all invitations (admin only)
- `POST` - Create new invitation (admin only)
- `DELETE` - Revoke invitation (admin only)

**`/api/invite/verify`** (Public)
- `GET` - Verify invitation token
- Returns email and expiration if valid

**`/api/invite/accept`** (Public)
- `POST` - Accept invitation and create account
- Validates token and password
- Creates user via Supabase Auth
- Returns session for immediate login

#### Utility Libraries

**`lib/auth.ts`**
- Role checking functions
- Invitation CRUD operations
- User profile management
- Admin verification helpers

**`lib/email.ts`**
- Email template generation
- Multi-provider support (Resend, SendGrid, Edge Function)
- Development mode fallback (console logging)

**`lib/supabase.ts`**
- Client creation utilities
- Server-side authentication
- Cookie-based session management

---

### 3. Frontend Layer

#### Pages

**`/admin`** (Protected)
- Admin dashboard
- Agency management
- Authentication component
- Link to invite page

**`/admin/invite`** (Protected, Admin Only)
- Send new invitations
- View invitation history
- Revoke pending invitations
- Real-time status updates

**`/invite/accept?token=xxx`** (Public)
- Token verification
- Password creation form
- Account activation
- Auto-redirect to dashboard

#### Components

**`AdminAuth.tsx`**
- Sign-in form only (no sign-up)
- Session management
- Cookie storage for API routes
- User status display

---

### 4. Middleware Layer

**`middleware.ts`**
- Admin route protection (`/admin/*`)
- Role verification against database
- Redirect to login if unauthorized
- Security headers on all responses
- Subdomain routing (for agency feature)

---

## 🔄 Data Flow Diagrams

### Invitation Flow

```
┌─────────┐                                      ┌──────────────┐
│ Admin   │                                      │ New User     │
└────┬────┘                                      └──────┬───────┘
     │                                                   │
     │ 1. Sign in to /admin                             │
     │ 2. Navigate to /admin/invite                     │
     │ 3. Enter email: user@example.com                 │
     ▼                                                   │
┌─────────────────────┐                                │
│ POST /api/admin/    │                                │
│      invite         │                                │
└─────────┬───────────┘                                │
          │                                             │
          │ 4. Check if admin (RLS)                    │
          │ 5. Generate secure token                   │
          │ 6. Insert into invitations table           │
          ▼                                             │
┌─────────────────────┐                                │
│ Supabase DB         │                                │
│ - invitations       │                                │
│   status: pending   │                                │
└─────────┬───────────┘                                │
          │                                             │
          │ 7. Send email with token                   │
          ▼                                             │
┌─────────────────────┐                                │
│ Email Service       │                                │
│ (Resend/SendGrid)   │─────────────────────────────► │
└─────────────────────┘    Invitation Email            │
                                                        │
                                     8. Click link     │
                                     /invite/accept?   │
                                     token=xxx         │
                                                        ▼
                                            ┌──────────────────┐
                                            │ GET /api/invite/ │
                                            │     verify       │
                                            └────────┬─────────┘
                                                     │
                                            9. Verify token    │
                                            10. Return email   │
                                                     ▼
                                            ┌──────────────────┐
                                            │ Show password    │
                                            │ creation form    │
                                            └────────┬─────────┘
                                                     │
                                            11. Enter password │
                                            12. Submit         │
                                                     ▼
                                            ┌──────────────────┐
                                            │ POST /api/invite/│
                                            │      accept      │
                                            └────────┬─────────┘
                                                     │
                                            13. Validate token │
                                            14. Create user    │
                                            15. Trigger fires  │
                                                     ▼
                                            ┌──────────────────┐
                                            │ on_auth_user_    │
                                            │ created()        │
                                            │ - Create profile │
                                            │ - Set role:admin │
                                            │ - Mark accepted  │
                                            └────────┬─────────┘
                                                     │
                                            16. Return session │
                                            17. Redirect to    │
                                                /admin          │
                                                     ▼
                                            ┌──────────────────┐
                                            │ Admin Dashboard  │
                                            │ (Full Access)    │
                                            └──────────────────┘
```

---

### Authentication Flow

```
┌─────────┐
│ User    │
└────┬────┘
     │
     │ Visit /admin/invite
     ▼
┌─────────────────────┐
│ Next.js Middleware  │
│ (middleware.ts)     │
└─────────┬───────────┘
          │
          │ Check: pathname.startsWith('/admin/')
          ▼
     ┌────────┐
     │ Auth?  │───No───► Redirect to /admin
     └───┬────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Query profiles      │
│ WHERE id = user.id  │
└─────────┬───────────┘
          │
          ▼
     ┌────────┐
     │ Admin? │───No───► Redirect to /admin
     └───┬────┘
         │ Yes
         ▼
┌─────────────────────┐
│ Allow access to     │
│ protected route     │
└─────────────────────┘
```

---

## 🔒 Security Model

### Defense in Depth

**Layer 1: Middleware**
- Route-level protection
- Early rejection of unauthorized requests
- No database calls for invalid requests

**Layer 2: API Route Guards**
- `requireAdmin()` function
- Throws error if not authenticated or not admin
- Used in all protected API routes

**Layer 3: Row Level Security**
- Database-level access control
- Cannot be bypassed by API
- Enforced on all queries

**Layer 4: Database Triggers**
- Automatic role assignment
- Prevents manual role escalation
- Validates invitation before granting admin

### Token Security

**Generation**
```typescript
// lib/auth.ts
export function generateInvitationToken(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}
```

**Storage**
- Stored plain in database (not hashed)
- Required for one-time verification
- Deleted/marked after use
- Expires after 7 days

**Transmission**
- HTTPS only (enforced by Vercel/production)
- Passed as URL query parameter
- Single-use validation

---

## 🎯 Design Decisions

### Why Database Triggers?

**Problem**: Need to assign role during sign-up, but:
- RLS prevents users from setting their own role
- API route can't set role after user creation

**Solution**: Database trigger
- Fires automatically on `INSERT` to `auth.users`
- Checks for valid invitation
- Creates profile with correct role
- Atomic operation (all or nothing)

### Why Separate Invitations Table?

**Alternative**: Store invite status in profiles table

**Why Separate**:
1. **Multiple invitations** - Can send multiple invites to same email
2. **History tracking** - Keep record of all invitations
3. **Revocation** - Can revoke before acceptance
4. **Audit trail** - Who invited whom, when
5. **Expiration** - Easy to query active invitations

### Why Two Role Values?

**`admin`** - Full access
**`pending_invite`** - Locked out (default for any signup without invitation)

**Why not just one**:
- Prevents accidental access if someone bypasses invitation system
- Clear distinction between active and inactive users
- Future-proof for adding more roles (e.g., 'viewer', 'editor')

---

## 📊 Database Schema

```sql
-- Complete schema overview

auth.users (managed by Supabase)
├── id (uuid, PK)
├── email (text)
├── encrypted_password (text)
└── created_at (timestamptz)

profiles (custom)
├── id (uuid, PK, FK → auth.users.id)
├── email (text, unique)
├── role (text: 'admin' | 'pending_invite')
├── invited_by (uuid, FK → auth.users.id)
├── invited_at (timestamptz)
├── activated_at (timestamptz)
├── last_sign_in_at (timestamptz)
├── metadata (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)

invitations (custom)
├── id (uuid, PK)
├── email (text)
├── token (text, unique)
├── invited_by (uuid, FK → auth.users.id)
├── status (text: 'pending' | 'accepted' | 'expired' | 'revoked')
├── expires_at (timestamptz)
├── accepted_at (timestamptz)
├── accepted_by (uuid, FK → auth.users.id)
├── created_at (timestamptz)
└── updated_at (timestamptz)

agencies (existing)
├── id (uuid, PK)
├── name (text)
├── subdomain (text, unique)
├── created_by (uuid, FK → auth.users.id)
└── ...

form_submissions (existing)
├── id (uuid, PK)
├── agency_id (uuid, FK → agencies.id)
└── ...
```

---

## 🚀 Performance Considerations

### Indexes

```sql
-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Invitations
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
```

### Query Optimization

- Middleware role check: Single query to profiles
- Invitation verification: Index on token
- Admin list: Index on role
- Expired invitations: Index on expires_at + status

### Caching Strategy

**What NOT to cache**:
- User role (needs to be real-time)
- Invitation status (changes on acceptance)

**What CAN be cached**:
- Agency list (changes rarely)
- Static pages (homepage, etc.)

---

## 🔄 Future Enhancements

### Potential Features

1. **Multiple Roles**
   - Add `viewer`, `editor` roles
   - Granular permissions per resource

2. **Invitation Templates**
   - Custom email templates per organization
   - Branding support

3. **User Management Dashboard**
   - Deactivate users
   - Change roles
   - View activity logs

4. **Audit Logging**
   - Track all admin actions
   - Login history
   - Change logs

5. **Two-Factor Authentication**
   - Add 2FA for admin accounts
   - Recovery codes

6. **Session Management**
   - View active sessions
   - Force logout
   - Session timeout

---

## 📚 Related Documentation

- [Setup Guide](./ADMIN_RBAC_SETUP.md)
- [API Documentation](./API.md) _(to be created)_
- [Deployment Guide](./DEPLOYMENT.md) _(to be created)_

---

**Last Updated**: {{ current_date }}
**Version**: 1.0.0

