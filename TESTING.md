# Testing Guide

Complete guide for testing the subdomain multi-tenancy system.

## Prerequisites

- Development server running: `npm run dev`
- Database migration completed
- Admin account created in Supabase Auth

## Test 1: Admin Authentication

### Via Admin Dashboard

1. Go to http://localhost:3000/admin
2. Click "Sign Up"
3. Enter email and password
4. Check email for confirmation link
5. Click confirmation link
6. Go back to admin page
7. Sign in with credentials
8. Verify "Signed in as" message appears

### Via Browser Console

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'your-secure-password'
});
console.log('Sign up result:', data, error);

// After email confirmation, sign in
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'your-secure-password'
});
console.log('Sign in result:', signInData, signInError);

// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

## Test 2: Create Agency (Via Admin Dashboard)

1. Go to http://localhost:3000/admin
2. Ensure you're signed in
3. Fill in the form:
   - **Agency Name**: Wanderlust Travel
   - **Subdomain**: wanderlust (auto-filled)
   - **Logo URL**: https://via.placeholder.com/150x50/059669/FFFFFF?text=Wanderlust
   - **Primary Color**: #059669
   - **Secondary Color**: #0ea5e9
4. Click "Create Agency"
5. Verify success message appears
6. Check that agency appears in the list below

## Test 3: Create Agency (Via API)

### Using fetch in Browser Console

```javascript
// After signing in via admin dashboard:
const response = await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Safari Adventures',
    subdomain: 'safari',
    logo_url: 'https://via.placeholder.com/150x50/D97706/FFFFFF?text=Safari',
    primary_color: '#D97706',
    secondary_color: '#DC2626',
  }),
});

const result = await response.json();
console.log('Create agency result:', result);
```

### Using curl

```bash
# Get your access token from browser cookies (sb-access-token)
# Then run:

curl -X POST http://localhost:3000/api/admin/agencies \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "name": "Luxury Escapes",
    "subdomain": "luxury",
    "logo_url": "https://via.placeholder.com/150x50/7C3AED/FFFFFF?text=Luxury",
    "primary_color": "#7C3AED",
    "secondary_color": "#EC4899"
  }'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Safari Adventures",
    "subdomain": "safari",
    "logo_url": "https://via.placeholder.com/150x50/D97706/FFFFFF?text=Safari",
    "primary_color": "#D97706",
    "secondary_color": "#DC2626",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "created_by": "user-uuid"
  },
  "message": "Agency created successfully"
}
```

## Test 4: List All Agencies

### Via Admin Dashboard

1. Go to http://localhost:3000/admin
2. Click "Refresh" button
3. Verify all agencies appear in table
4. Check logo displays (if provided)
5. Verify colors show correctly

### Via API

```javascript
const response = await fetch('/api/admin/agencies');
const result = await response.json();
console.log('Agencies:', result.data);
```

## Test 5: Access Agency Subdomain

### Test Each Agency

```bash
# In browser, visit each:
http://wanderlust.localhost:3000
http://safari.localhost:3000
http://luxury.localhost:3000
```

### Verify Branding

For each subdomain, check:

- [ ] Agency name appears in header
- [ ] Logo displays (if provided)
- [ ] "Powered by [Agency Name]" text shows
- [ ] Primary color applied to:
  - Submit button
  - Card border
  - Checkboxes/radios
- [ ] Secondary color applied to:
  - "Powered by" text
  - Golf trip highlight box

### Visual Test Checklist

Open http://wanderlust.localhost:3000:

1. **Header Section**
   - [ ] Logo visible (if set)
   - [ ] "Powered by Wanderlust Travel" text
   - [ ] "Travel Planning Form" title

2. **Form Colors**
   - [ ] Submit button matches primary color
   - [ ] Checkbox accents match primary color
   - [ ] Border color matches primary

3. **Functionality**
   - [ ] All form fields work
   - [ ] Can select destinations
   - [ ] Form validates correctly

## Test 6: Submit Form from Agency Subdomain

1. Go to http://wanderlust.localhost:3000
2. Fill out the form:
   - **Client Name**: John Doe
   - **Number of travellers**: 2
   - **Travel months**: Select any
   - **Route preference**: Trip Design
3. Fill remaining fields as needed
4. Click "Continue"
5. Check browser console for:
   ```
   Form saved to database: { success: true, data: { id: "..." } }
   ```

## Test 7: Verify Form Submission in Database

### Via Supabase Dashboard

1. Go to Supabase Dashboard
2. Open Table Editor
3. Select `form_submissions` table
4. Verify new row exists with:
   - `agency_id` = agency UUID
   - `client_name` = "John Doe"
   - `form_data` = JSON object

### Via SQL

```sql
SELECT 
  fs.id,
  fs.client_name,
  fs.num_travellers,
  a.name as agency_name,
  a.subdomain,
  fs.created_at
FROM form_submissions fs
LEFT JOIN agencies a ON fs.agency_id = a.id
ORDER BY fs.created_at DESC
LIMIT 10;
```

## Test 8: Submit Form from Main Domain

1. Go to http://localhost:3000 (no subdomain)
2. Fill out the form
3. Submit
4. Verify submission saved with `agency_id = null`

### Check in Database

```sql
SELECT * FROM form_submissions 
WHERE agency_id IS NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

## Test 9: Test Invalid Subdomain

1. Visit http://nonexistent.localhost:3000
2. Verify 404 error response:
   ```json
   {
     "error": "Agency not found",
     "message": "The agency 'nonexistent' does not exist."
   }
   ```

## Test 10: Test Subdomain Validation

Try creating agencies with invalid subdomains:

```javascript
// Test cases that should FAIL
const invalidSubdomains = [
  'a',              // Too short (min 2 chars)
  '-start',         // Starts with hyphen
  'end-',           // Ends with hyphen
  'HAS_CAPS',       // Has uppercase
  'has spaces',     // Has spaces
  'has.dot',        // Has dot
  'www',            // Reserved
  'api',            // Reserved
  'admin',          // Reserved
];

for (const subdomain of invalidSubdomains) {
  const response = await fetch('/api/admin/agencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Agency',
      subdomain: subdomain,
    }),
  });
  
  const result = await response.json();
  console.log(`${subdomain}: ${result.success ? '❌ FAIL (should reject)' : '✅ PASS (rejected)'}`);
}
```

## Test 11: Test Redis Caching

### Monitor Cache Behavior

```javascript
// First request (cache miss)
console.time('First request');
await fetch('http://wanderlust.localhost:3000');
console.timeEnd('First request');

// Second request (cache hit)
console.time('Second request');
await fetch('http://wanderlust.localhost:3000');
console.timeEnd('Second request');

// Second request should be faster
```

### Check Logs

Look for these in terminal:
```
[Agency] Cache miss for subdomain: wanderlust, fetching from DB
[Agency] Cached agency: wanderlust
[Agency] Cache hit for subdomain: wanderlust
```

## Test 12: Test Without Redis

1. Remove Redis env vars from `.env.local`:
   ```
   # UPSTASH_REDIS_REST_URL=...
   # UPSTASH_REDIS_REST_TOKEN=...
   ```
2. Restart dev server
3. Visit http://wanderlust.localhost:3000
4. Verify it still works (just slower)
5. Check terminal for: `Redis credentials not configured. Caching will be disabled.`

## Test 13: Test Color Customization

Create agency with custom colors:

```javascript
await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Custom Colors Agency',
    subdomain: 'custom',
    primary_color: '#FF6B6B',   // Red
    secondary_color: '#4ECDC4', // Teal
  }),
});
```

Visit http://custom.localhost:3000 and verify:
- Submit button is red (#FF6B6B)
- Accent text is teal (#4ECDC4)

## Test 14: Test Logo Display

Create agency with logo:

```javascript
await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Logo Test Agency',
    subdomain: 'logotest',
    logo_url: 'https://via.placeholder.com/200x60/059669/FFFFFF?text=Logo+Test',
  }),
});
```

Visit http://logotest.localhost:3000 and verify:
- Logo appears in header
- Logo is max height 4rem (h-16)
- Logo doesn't break layout

## Test 15: Production Readiness Checklist

Before deploying to production:

- [ ] All tests above pass
- [ ] Database migration completed in production Supabase
- [ ] Environment variables set in Vercel
- [ ] Wildcard domain configured (*.yourdomain.com)
- [ ] At least one agency created
- [ ] SSL certificate active (automatic on Vercel)
- [ ] RLS policies verified in Supabase
- [ ] Upstash Redis account has sufficient limits
- [ ] Webhook URLs updated (if different in production)

## Performance Benchmarks

Expected performance metrics:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Subdomain resolution (cache hit) | < 50ms | Browser DevTools Network tab |
| Subdomain resolution (cache miss) | < 200ms | Browser DevTools Network tab |
| Form submission | < 500ms | Browser DevTools Network tab |
| Agency creation | < 1s | Admin dashboard |
| Redis cache hit rate | > 80% | Upstash dashboard |

## Troubleshooting Failed Tests

### Test 2 Fails (Can't Create Agency)
- Verify you're signed in
- Check browser console for errors
- Verify RLS policies allow authenticated insert
- Check Supabase logs

### Test 5 Fails (Subdomain 404)
- Verify agency exists in database
- Check middleware logs in terminal
- Try clearing Redis cache
- Restart dev server

### Test 6 Fails (Form Submission Error)
- Check browser console for errors
- Verify `/api/submissions` endpoint works
- Check RLS policies on form_submissions table
- Verify webhook URLs are accessible

### Test 11 Fails (No Cache)
- Verify Redis credentials in `.env.local`
- Check Upstash dashboard for connection errors
- Verify Redis instance is active
- Check rate limits on Upstash account

## Automated Testing Script

Save as `test-subdomain-system.js`:

```javascript
async function runTests() {
  console.log('🧪 Running Subdomain System Tests\n');
  
  // Test 1: Main domain loads
  console.log('Test 1: Main domain...');
  const mainResponse = await fetch('http://localhost:3000');
  console.log(mainResponse.ok ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Agency subdomain loads
  console.log('Test 2: Agency subdomain...');
  const agencyResponse = await fetch('http://wanderlust.localhost:3000');
  console.log(agencyResponse.ok ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: Invalid subdomain returns 404
  console.log('Test 3: Invalid subdomain...');
  const invalidResponse = await fetch('http://invalid.localhost:3000');
  console.log(!invalidResponse.ok ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n✨ Tests complete!');
}

runTests();
```

Run with:
```bash
node test-subdomain-system.js
```

---

## Next Steps After Testing

1. Create your production agencies
2. Configure custom domains (optional)
3. Set up monitoring and analytics
4. Train team on admin dashboard
5. Document agency-specific workflows
6. Set up backup procedures for Supabase

Happy testing! 🎉


