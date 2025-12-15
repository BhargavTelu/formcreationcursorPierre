/**
 * Setup Script for Creating Initial Super Admin
 * 
 * This script helps you create the first super admin user for your application.
 * 
 * Usage:
 * 1. Make sure you have set up your Supabase project and run the migrations
 * 2. Create a .env.local (or export env vars) with:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - SUPER_ADMIN_EMAIL
 *    - SUPER_ADMIN_PASSWORD
 * 3. Run: node scripts/setup-super-admin.js
 * 
 * OR use the manual SQL script: create-super-admin.sql
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Add this to your .env.local

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

async function createSuperAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('Please set:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (get this from Supabase Settings > API)');
    process.exit(1);
  }

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error('❌ Missing bootstrap admin credentials!');
    console.error('Please set:');
    console.error('  - SUPER_ADMIN_EMAIL');
    console.error('  - SUPER_ADMIN_PASSWORD (min 12 chars recommended)');
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
      if (userData.msg?.includes('already been registered') || userData.code === 'email_exists') {
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

    // Ensure profiles record exists and is admin (this app uses `profiles`, not a separate admin_users table)
    console.log('\n3️⃣ Ensuring profiles role=admin...');
    const now = new Date().toISOString();
    const upsertProfileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: user.id,
        email: SUPER_ADMIN_EMAIL.toLowerCase(),
        role: 'admin',
        activated_at: now,
      }),
    });

    if (!upsertProfileResponse.ok) {
      const errText = await upsertProfileResponse.text();
      console.error('❌ Failed to upsert profiles row:', errText);
      process.exit(1);
    }

    console.log('✅ profiles updated to admin');

    console.log('\n✨ SUCCESS! Super Admin created!\n');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('\n⚠️  IMPORTANT: Store credentials securely and rotate them if they were shared.');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start the app and sign in at: /login');
    console.log('   2. Visit: /admin/dashboard');
    console.log('   3. Invite additional admins from: /admin/invite');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();







