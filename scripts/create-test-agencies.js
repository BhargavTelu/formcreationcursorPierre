/**
 * Script to create test agencies
 * 
 * Usage:
 * 1. Make sure you're authenticated with Supabase
 * 2. Update the BASE_URL if needed
 * 3. Run: node scripts/create-test-agencies.js
 * 
 * Note: You need to have a valid Supabase auth session
 */

const BASE_URL = 'http://localhost:3000'; // Change to your deployment URL

const testAgencies = [
  {
    name: 'Wanderlust Travel',
    subdomain: 'wanderlust',
    logo_url: 'https://via.placeholder.com/150x50/059669/FFFFFF?text=Wanderlust',
    primary_color: '#059669',
    secondary_color: '#0ea5e9',
  },
  {
    name: 'Safari Adventures',
    subdomain: 'safari',
    logo_url: 'https://via.placeholder.com/150x50/D97706/FFFFFF?text=Safari',
    primary_color: '#D97706',
    secondary_color: '#DC2626',
  },
  {
    name: 'Luxury Escapes',
    subdomain: 'luxury',
    logo_url: 'https://via.placeholder.com/150x50/7C3AED/FFFFFF?text=Luxury',
    primary_color: '#7C3AED',
    secondary_color: '#EC4899',
  },
];

async function createAgency(agency) {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/agencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You need to add authentication headers here
        // Cookie: 'sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_TOKEN'
      },
      body: JSON.stringify(agency),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✓ Created agency: ${agency.name} (${agency.subdomain})`);
      console.log(`  URL: http://${agency.subdomain}.localhost:3000`);
      return result;
    } else {
      console.error(`✗ Failed to create ${agency.name}:`, result.error || result.message);
      return null;
    }
  } catch (error) {
    console.error(`✗ Error creating ${agency.name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Creating test agencies...\n');

  for (const agency of testAgencies) {
    await createAgency(agency);
    console.log('');
  }

  console.log('Done!');
  console.log('\nTest the agencies:');
  testAgencies.forEach(agency => {
    console.log(`  - http://${agency.subdomain}.localhost:3000`);
  });
}

// Only run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}

module.exports = { createAgency, testAgencies };


