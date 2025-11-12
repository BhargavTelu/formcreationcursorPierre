/**
 * Setup Script for Creating Initial Super Admin
 * 
 * This script helps you create the first super admin user for your application.
 * 
 * Usage:
 * 1. Make sure you have set up your Supabase project and run the migrations
 * 2. Update the EMAIL and PASSWORD variables below
 * 3. Run: node scripts/setup-super-admin.js
 * 
 * OR use the manual SQL script: create-super-admin.sql
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Add this to your .env.local

// Configuration - UPDATE THESE VALUES
const SUPER_ADMIN_EMAIL = 'bhargavkiran101@gmail.com'; // Change this
const SUPER_ADMIN_PASSWORD = 'Bhargav@123'; // Change this

async function createSuperAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('Please set:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (get this from Supabase Settings > API)');
    process.exit(1);
  }

  if (SUPER_ADMIN_EMAIL === 'admin@yourdomain.com') {
    console.error('❌ Please update the SUPER_ADMIN_EMAIL in the script!');
    process.exit(1);
  }

  console.log('🚀 Creating Super Admin...\n');
  console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  try {
    // Create the user in Supabase Auth
    console.log('1️⃣ Creating auth user...');
    const createUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email
      }),
    });

    const userData = await createUserResponse.json();

    if (!createUserResponse.ok) {
      if (userData.msg?.includes('already been registered')) {
        console.log('⚠️  User already exists in auth. Continuing...');
      } else {
        console.error('❌ Error creating auth user:', userData);
        process.exit(1);
      }
    } else {
      console.log('✅ Auth user created');
    }

    // Get the user ID
    console.log('\n2️⃣ Getting user ID...');
    const getUserResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(SUPER_ADMIN_EMAIL)}`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      }
    );

    const usersData = await getUserResponse.json();
    const user = usersData.users?.[0];

    if (!user) {
      console.error('❌ Could not find user after creation');
      process.exit(1);
    }

    console.log(`✅ User ID: ${user.id}`);

    // Create admin_users record
    console.log('\n3️⃣ Creating admin_users record...');
    const createAdminResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        email: SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        is_active: true,
        invited_by: null,
      }),
    });

    if (!createAdminResponse.ok) {
      const error = await createAdminResponse.text();
      if (error.includes('duplicate key')) {
        console.log('⚠️  Admin user already exists in database');
      } else {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Admin user record created');
    }

    // Log the action
    console.log('\n4️⃣ Creating audit log...');
    const logResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        admin_user_id: null,
        admin_email: 'system',
        action: 'create_super_admin',
        resource_type: 'admin_user',
        resource_id: user.id,
        details: {
          email: SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          created_via: 'setup_script',
        },
      }),
    });

    if (logResponse.ok) {
      console.log('✅ Audit log created');
    }

    console.log('\n✨ SUCCESS! Super Admin created!\n');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Go to your admin panel: https://yourdomain.com/admin');
    console.log('   2. Sign in with the credentials above');
    console.log('   3. Start inviting other admins!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();







