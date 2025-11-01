# Super Admin Setup Guide

This guide explains how to set up the super admin system for agency management.

## Overview

The admin system restricts agency creation to only authorized super admins. Admins are managed through a database table, and new admins are invited via email.

## Setup Steps

### 1. Run Database Migration

Run the SQL migration in your Supabase SQL Editor:

```sql
-- File: create-admin-users-table.sql
```

This creates:
- `admin_users` table to track super admins
- RLS policies for security
- Triggers to auto-activate admins when they confirm their email

### 2. Set Environment Variable

Add your Supabase Service Role Key to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Where to find it:**
- Go to Supabase Dashboard
- Settings → API
- Copy the `service_role` key (⚠️ Keep this secret!)

### 3. Create Your First Admin

See `CREATE_FIRST_ADMIN.md` for detailed step-by-step instructions on creating your first admin user via SQL.

**Quick Steps:**
1. Create a user via Supabase Dashboard (Authentication → Users)
2. Copy the User ID
3. Run the SQL query from `create-first-admin.sql` to insert into `admin_users` table

### 4. Access the Admin Panel

1. Go to `/admin` page
2. Sign in with your admin email and password
3. You should now see:
   - Admin Management section (invite other admins)
   - Create Agency form
   - Agencies list

## How It Works

### Admin Invitation Flow

1. **Existing Admin invites new admin:**
   - Admin enters email in "Invite New Admin" form
   - System creates user in `auth.users` (if doesn't exist)
   - System adds email to `admin_users` table with status `pending`
   - System sends invitation/password reset email

2. **New admin receives email:**
   - Clicks link in email
   - Sets password
   - Status automatically changes to `active` (via database trigger)

3. **New admin can now:**
   - Sign in to `/admin` page
   - Create agencies
   - Invite other admins

### Password Reset Flow

If an existing admin forgets their password:

1. Go to `/admin` page
2. Click "Forgot password or first time setup?"
3. Enter email
4. System checks if email is in `admin_users` table
5. If authorized, password reset email is sent
6. Follow email instructions to reset password

### Security Features

✅ **Database-driven authorization** - No environment variable changes needed  
✅ **Row Level Security (RLS)** - Only active admins can view/modify admin list  
✅ **Email verification** - Only emails in database can reset passwords  
✅ **Status tracking** - Track pending/active/inactive admins  
✅ **Audit trail** - Record who invited which admin  

## API Endpoints

### POST /api/admin/invite
Invite a new admin (requires super admin authentication)

**Request:**
```json
{
  "email": "newadmin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent to newadmin@example.com. They will receive an email to set their password."
}
```

### GET /api/admin/invite
Get list of all admins (requires super admin authentication)

### POST /api/admin/check-email
Check if email is authorized (used for password reset verification)

## Database Schema

### admin_users table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Admin email (unique) |
| user_id | UUID | Reference to auth.users(id) |
| status | TEXT | 'pending', 'active', or 'inactive' |
| invited_by | UUID | User ID who invited this admin |
| invited_at | TIMESTAMP | When invitation was sent |
| activated_at | TIMESTAMP | When admin activated their account |
| is_active | BOOLEAN | Whether admin is currently active |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Troubleshooting

### "Service role key not configured"
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Restart your development server after adding the variable

### "This email is not authorized"
- Email must be in `admin_users` table first
- Use the invitation form to add new admins
- Or manually insert into database (for first admin)

### Admin can't sign in after invitation
- Check `status` in `admin_users` table - should be 'active'
- If 'pending', the trigger should activate on email confirmation
- Manually update if needed: `UPDATE admin_users SET status = 'active' WHERE email = '...'`

### "Forbidden. Only super admins can..."
- User is authenticated but not in `admin_users` table
- Check `admin_users` table for user's email
- Verify `status = 'active'` and `is_active = true`

## Production Checklist

- [ ] Run database migration
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in production environment
- [ ] Create first admin account
- [ ] Test invitation flow
- [ ] Test password reset flow
- [ ] Verify RLS policies are working
- [ ] Document admin email addresses

## Notes

- The first admin must be created manually (via SQL or code)
- All subsequent admins can be invited through the UI
- Admins can invite other admins (no limit)
- Email addresses are case-insensitive (stored as lowercase)
- Admins can see who invited them (audit trail)

