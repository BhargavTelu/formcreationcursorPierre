# Agency Authentication System Setup Guide

This document describes the production-ready agency authentication system that has been implemented.

## Overview

The agency authentication system provides secure login functionality for agencies, separate from the admin authentication system. **Each agency has exactly one login credential** - one user per agency.

## Database Setup

### Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Run the `agency-auth-schema.sql` file
3. This will create:
   - `agency_users` table - Stores agency login credentials
   - `agency_sessions` table - Stores active sessions
   - RLS policies for security
   - Helper functions

### Step 2: Verify Tables

After running the schema, verify the tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agency_users', 'agency_sessions');
```

## Features

### 1. Secure Password Storage
- Passwords are hashed using SHA-256
- Passwords are never stored in plain text
- Minimum 12 characters required

### 2. Session Management
- Secure session tokens (32-byte random)
- Tokens are hashed before storage
- Sessions expire after 7 days (configurable)
- Automatic cleanup of expired sessions

### 3. One User Per Agency
- Each agency has exactly one login credential
- Unique constraint on `agency_id` ensures only one user per agency
- All authenticated agency users have full access to their agency

### 4. Security Features
- Row Level Security (RLS) on all tables
- HTTP-only cookies for session tokens
- Secure flag in production (HTTPS only)
- IP address and user agent tracking
- Automatic session invalidation on password change

## Usage

### Creating an Agency (Admin)

When an admin creates an agency, an initial user is automatically created:

1. Admin creates agency via `/admin/dashboard`
2. System creates agency record
3. System creates the agency user (one per agency) with:
   - Email: Agency email
   - Password: Randomly generated (shown in response)
4. Admin should save the password and share with agency

**Important**: The initial password is shown in the API response. In production, consider sending it via email.

### Agency Login

1. Agency user visits: `https://[subdomain].yourdomain.com/login`
   - Or: `http://localhost:3000/agency/[subdomain]/login` (development)
2. Enters email and password
3. System validates credentials
4. Creates session and sets cookie
5. Redirects to dashboard

### Agency Dashboard

- URL: `/agency/[subdomain]/dashboard`
- Protected route - requires authentication
- Shows agency information and stats
- Allows logout

## API Endpoints

### POST `/api/agency/auth/login`
Login endpoint for agency users.

**Request:**
```json
{
  "email": "user@agency.com",
  "password": "password123",
  "agency_subdomain": "agency-name"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@agency.com",
    "name": "User Name",
    "agency_id": "uuid",
    "agency_name": "Agency Name",
    "agency_subdomain": "agency-name"
  }
}
```

### POST `/api/agency/auth/logout`
Logout endpoint - invalidates session.

### GET `/api/agency/auth/me`
Get current authenticated user information.

## File Structure

```
lib/
  ├── agency-auth.ts          # Core authentication functions
  ├── agency-auth-helpers.ts   # Request helpers and middleware
  └── types.ts                 # TypeScript types

app/
  ├── api/agency/auth/
  │   ├── login/route.ts      # Login endpoint
  │   ├── logout/route.ts     # Logout endpoint
  │   └── me/route.ts         # Current user endpoint
  └── agency/[subdomain]/
      ├── login/
      │   ├── page.tsx         # Server component wrapper
      │   └── login-client.tsx # Client login form
      └── dashboard/
          └── page.tsx         # Protected dashboard

components/
  └── AgencyDashboardClient.tsx # Dashboard UI component
```

## Security Best Practices

1. **Password Requirements**
   - Minimum 12 characters
   - Consider adding complexity requirements
   - Consider using bcrypt or Argon2 instead of SHA-256

2. **Session Security**
   - Sessions expire after 7 days
   - Tokens are cryptographically random
   - HTTP-only cookies prevent XSS attacks
   - Secure flag ensures HTTPS in production

3. **Rate Limiting**
   - Consider adding rate limiting to login endpoint
   - Prevent brute force attacks

4. **Password Reset**
   - Implement password reset functionality
   - Use secure tokens with expiration
   - Send reset links via email

5. **Audit Logging**
   - Log all login attempts
   - Log password changes
   - Log role changes

## Testing

### Create Test Agency User

After creating an agency, you can create additional users via SQL:

```sql
-- Get agency ID
SELECT id FROM agencies WHERE subdomain = 'your-subdomain';

-- Create user (password will be hashed)
INSERT INTO agency_users (
  agency_id,
  email,
  password_hash,
  name,
  role,
  is_active
) VALUES (
  'agency-uuid-here',
  'user@example.com',
  encode(digest('your-password-here', 'sha256'), 'hex'),
  'Test User',
  'owner',
  true
);
```

### Test Login

1. Visit: `http://localhost:3000/agency/[subdomain]/login`
2. Enter credentials
3. Should redirect to dashboard on success

## Troubleshooting

### "Agency not found" error
- Verify agency exists in database
- Check subdomain matches exactly

### "Invalid email or password" error
- Verify user exists for that agency
- Check user is active (`is_active = true`)
- Verify password hash matches

### Session not persisting
- Check cookies are being set
- Verify `sameSite: 'lax'` setting
- Check browser allows cookies

### RLS Policy Errors
- Verify RLS policies are created
- Check service role key is set
- Ensure policies allow service role operations

## Next Steps

1. **Password Reset Flow**
   - Add password reset request endpoint
   - Add password reset confirmation endpoint
   - Send reset emails

2. **User Management**
   - Add API to list agency users
   - Add API to create/update/delete users
   - Add UI for user management

3. **Enhanced Dashboard**
   - Show form submissions
   - Show analytics
   - Agency settings page

4. **Email Notifications**
   - Send welcome email with credentials
   - Send password reset emails
   - Send login notifications

5. **Two-Factor Authentication**
   - Add 2FA support
   - Use TOTP or SMS

## Production Checklist

- [ ] Run database schema migration
- [ ] Set secure cookie flags in production
- [ ] Implement rate limiting
- [ ] Set up email service for notifications
- [ ] Add password reset functionality
- [ ] Implement audit logging
- [ ] Set up monitoring and alerts
- [ ] Test all authentication flows
- [ ] Document password requirements for users
- [ ] Create user management interface

