# Step-by-Step Guide: Creating Your First Admin User in Supabase

This guide will walk you through creating your first super admin user using Supabase SQL Editor.

## Prerequisites

1. ✅ You have access to Supabase Dashboard
2. ✅ You have run the `create-admin-users-table.sql` migration
3. ✅ You know the email address you want to use as admin

## Recommended Method: Via Supabase Dashboard + SQL

This is the recommended and simplest approach. Create the auth user via Dashboard, then use SQL to add them to admin_users table.

### Step 1: Create User via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Users** in the left sidebar
4. Click **Add User** → **Create New User**
5. Enter:
   - **Email**: Your admin email (e.g., `admin@yourdomain.com`)
   - **Password**: A strong password
   - ✅ **Important:** Check **Auto Confirm User**
6. Click **Create User**
7. **Copy the User ID** (shown in the user list or user details page)

### Step 2: Insert into admin_users Table

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Run this SQL query (replace the placeholders):

```sql
-- Insert into admin_users table
-- Replace with:
-- - Your email address
-- - The User ID from Step 1 (from Authentication dashboard)

INSERT INTO admin_users (
  email,
  user_id,
  status,
  is_active,
  activated_at
)
VALUES (
  'admin@yourdomain.com',  -- CHANGE THIS to your email
  'PASTE_USER_ID_FROM_DASHBOARD_HERE',  -- CHANGE THIS to User ID from Step 1
  'active',
  true,
  NOW()
)
RETURNING *;
```

### Step 3: Verify the Admin User

Run this query to verify everything was created correctly:

```sql
-- Verify admin user was created
SELECT 
  au.id,
  au.email,
  au.status,
  au.is_active,
  au.activated_at,
  au.user_id,
  u.email as auth_email,
  u.email_confirmed_at,
  CASE 
    WHEN au.status = 'active' AND au.is_active = true THEN '✅ Admin Active'
    ELSE '❌ Admin Not Active'
  END as status_check
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
WHERE au.email = 'your-email@example.com';  -- Replace with your email
```

You should see:
- ✅ `status` = 'active'
- ✅ `is_active` = true
- ✅ `auth_email` matches your email
- ✅ `email_confirmed_at` is not null
- ✅ `status_check` = '✅ Admin Active'

## Alternative: Find User by Email (If You Don't Have User ID)

If you created the user via Dashboard but forgot to copy the User ID, you can use this SQL query that automatically finds the user by email:

```sql
-- Insert into admin_users by finding user automatically
INSERT INTO admin_users (
  email,
  user_id,
  status,
  is_active,
  activated_at
)
SELECT 
  u.email,
  u.id,
  'active',
  true,
  NOW()
FROM auth.users u
WHERE u.email = 'your-email@example.com'  -- Replace with your email
  AND u.email_confirmed_at IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET 
  user_id = EXCLUDED.user_id,
  status = 'active',
  is_active = true,
  activated_at = NOW()
RETURNING *;
```

If you encounter RLS policy issues when trying to insert, temporarily bypass them:

### Step 1: Temporarily Disable RLS (Only for First Admin)

```sql
-- Temporarily disable RLS for admin_users
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

### Step 2: Create Admin User

Use the recommended method above (Dashboard + SQL) to create your admin.

### Step 3: Re-enable RLS

```sql
-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

**Note:** After creating the first admin, you should be able to create others through the admin panel UI, which will work with RLS enabled.

## Troubleshooting


### Issue: "duplicate key value violates unique constraint"

**Solution:** The email already exists. Either:
- Use a different email
- Delete the existing user first
- Update the existing user to be admin

### Issue: "violates foreign key constraint"

**Solution:** Make sure:
- The `user_id` exists in `auth.users` table
- The UUID format is correct (8-4-4-4-12 format)

### Issue: Can't insert due to RLS

**Solution:** Temporarily disable RLS (see "Troubleshooting: If RLS Blocks You" section above), create admin, then re-enable.

## Testing Your Admin User

1. Go to your application: `http://localhost:3000/admin`
2. Sign in with:
   - **Email**: The email you used
   - **Password**: The password you set
3. You should see:
   - ✅ "Signed in as: [your email]"
   - ✅ Admin Management section
   - ✅ Create Agency form
   - ✅ Admins list

## Next Steps

After creating your first admin:

1. ✅ Test that you can sign in
2. ✅ Test creating an agency
3. ✅ Test inviting another admin (this will test the full flow)
4. ✅ Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (needed for inviting admins)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Security**: Choose a strong, unique password
2. **Email Confirmation**: Make sure `email_confirmed_at` is set (not null)
3. **First Admin**: This first admin has full access - protect it well!
4. **Service Role Key**: Never commit this to git - keep it in `.env.local` only
5. **RLS**: Always re-enable RLS after creating the first admin if you disabled it

---

**Need Help?** Check `ADMIN_SETUP_GUIDE.md` for more information.

