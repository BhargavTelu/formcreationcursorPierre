# Agency Password Reset System Setup Guide

This document describes the password reset functionality that has been implemented for agency users.

## Overview

The agency password reset system allows agency users to reset their passwords securely via email. This solves the problem where agency credentials are created with unknown passwords - now agency owners receive a password reset link via email when their agency is created.

## Database Setup

### Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard → SQL Editor
2. Run the `agency-password-reset-schema.sql` file
3. This will create:
   - `agency_password_reset_tokens` table - Stores password reset tokens
   - RLS policies for security
   - Helper functions for cleanup

### Step 2: Verify Table

After running the schema, verify the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'agency_password_reset_tokens';
```

## Features

### 1. Secure Token Generation
- Tokens are 32-byte random hex strings
- Tokens are hashed (SHA-256) before storage
- Tokens expire after 1 hour (configurable)
- Tokens can only be used once

### 2. Email-Based Reset Flow
- User requests password reset via "Forgot Password" link
- System sends reset link to user's email
- User clicks link and sets new password
- Token is invalidated after use

### 3. Agency Creation Integration
- When an agency is created, a password reset email is automatically sent
- Initial reset token is valid for 7 days (for account setup)
- Agency owner can set their password via the reset link

### 4. Security Features
- Tokens are single-use only
- Tokens expire after 1 hour (or 7 days for initial setup)
- Old unused tokens are invalidated when new ones are created
- Email enumeration prevention (always returns success message)
- All sessions are invalidated when password is reset

## API Endpoints

### POST `/api/agency/auth/forgot-password`

Request a password reset link.

**Request Body:**
```json
{
  "email": "user@example.com",
  "agency_subdomain": "agency-name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### POST `/api/agency/auth/reset-password`

Reset password using a token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "new-secure-password-min-12-chars"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

## Frontend Pages

### Forgot Password Page
- **Route:** `/agency/[subdomain]/forgot-password`
- User enters their email address
- System sends password reset link
- Shows success message

### Reset Password Page
- **Route:** `/agency/[subdomain]/reset-password?token=...`
- User sets new password (min 12 characters)
- Confirms password
- Redirects to login after successful reset

### Login Page Update
- Added "Forgot your password?" link
- Links to forgot password page

## Usage Flow

### For Existing Users (Forgot Password)

1. User clicks "Forgot your password?" on login page
2. User enters email address
3. System sends password reset email
4. User clicks link in email
5. User sets new password
6. User is redirected to login page

### For New Agencies (Initial Setup)

1. Admin creates agency via admin dashboard
2. System creates agency user with random password
3. System automatically sends password reset email to agency owner
4. Agency owner clicks link in email (valid for 7 days)
5. Agency owner sets their password
6. Agency owner can now log in

## Email Template

The password reset email includes:
- Agency branding (name and logo if available)
- Clear call-to-action button
- Reset link (also shown as text)
- Expiration notice (1 hour)
- Security notice

## Security Considerations

1. **Email Enumeration Prevention**: The forgot password endpoint always returns success, even if the email doesn't exist
2. **Token Security**: Tokens are hashed before storage and cannot be retrieved
3. **Token Expiration**: Tokens expire after 1 hour (or 7 days for initial setup)
4. **Single Use**: Tokens can only be used once
5. **Session Invalidation**: All existing sessions are invalidated when password is reset
6. **Rate Limiting**: Consider adding rate limiting to prevent abuse

## Maintenance

### Cleanup Expired Tokens

Run this function periodically to clean up expired and used tokens:

```sql
SELECT cleanup_expired_agency_password_reset_tokens();
```

You can set up a cron job or scheduled task to run this daily.

## Testing

### Test Forgot Password Flow

1. Navigate to `/agency/[subdomain]/login`
2. Click "Forgot your password?"
3. Enter email address
4. Check email for reset link
5. Click link and set new password
6. Verify you can log in with new password

### Test Agency Creation

1. Create new agency via admin dashboard
2. Check agency owner's email for password reset link
3. Click link and set password
4. Verify login works

## Troubleshooting

### Email Not Sending

- Check `RESEND_API_KEY` environment variable is set
- Check email service logs
- Verify email address is valid
- Check spam folder

### Token Invalid/Expired

- Tokens expire after 1 hour (or 7 days for initial setup)
- Tokens can only be used once
- Request a new reset link if token is expired

### Password Reset Not Working

- Verify token is valid and not expired
- Check password meets requirements (min 12 characters)
- Verify user account is active
- Check server logs for errors


