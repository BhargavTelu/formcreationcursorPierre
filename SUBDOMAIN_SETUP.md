# Subdomain Multi-tenancy Setup Guide

This guide explains how to set up and use the subdomain-based multi-tenancy feature for travel agencies.

## Overview

Each travel agency gets a unique subdomain (e.g., `wanderlust.finestafrica.ai`) that routes to their branded travel planning form.

## Prerequisites

1. **Supabase Database**: Run the SQL migration script
2. **Upstash Redis**: Create a Redis database for caching
3. **Vercel Deployment**: Wildcard subdomains configured
4. **Supabase Auth**: Set up for admin access

## Setup Steps

### 1. Database Setup

Run the SQL migration script in your Supabase SQL Editor:

```bash
# File: supabase-migration.sql
```

This creates:
- `agencies` table
- `form_submissions` table
- Row Level Security (RLS) policies
- Indexes for performance

### 2. Environment Variables

Create a `.env.local` file with:

```env
# Required: Upstash Redis (for caching)
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Required: Main domain
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai

# Optional: Extra admin API security
ADMIN_API_KEY=your_secret_key
```

**Get Upstash Redis credentials:**
1. Go to https://console.upstash.com/
2. Create a new Redis database
3. Copy the REST URL and Token

### 3. Local Development

For local testing with subdomains:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Access agency subdomains:
   - Main site: `http://localhost:3000`
   - Agency site: `http://wanderlust.localhost:3000`
   - Another agency: `http://safari.localhost:3000`

**Note**: `.localhost` subdomains work natively in modern browsers.

### 4. Vercel Deployment

1. Set environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `UPSTASH_REDIS_REST_URL`
   - Add `UPSTASH_REDIS_REST_TOKEN`
   - Add `NEXT_PUBLIC_APP_DOMAIN`

2. Ensure wildcard domain is configured:
   - Vercel automatically supports `*.finestafrica.ai`
   - Verify in Project Settings → Domains

3. Deploy:
   ```bash
   git push origin main
   ```

### 5. Create Your First Agency

You need to authenticate with Supabase Auth first, then create an agency:

**Option 1: Using curl**

```bash
# Get your access token from Supabase Auth
# Then create an agency:

curl -X POST https://finestafrica.ai/api/admin/agencies \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Wanderlust Travel",
    "subdomain": "wanderlust",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#059669",
    "secondary_color": "#0ea5e9"
  }'
```

**Option 2: Using JavaScript**

```javascript
// After signing in with Supabase Auth
const response = await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Wanderlust Travel',
    subdomain: 'wanderlust',
    logo_url: 'https://example.com/logo.png',
    primary_color: '#059669',
    secondary_color: '#0ea5e9',
  }),
});

const result = await response.json();
console.log(result);
```

## API Endpoints

### Create Agency
```
POST /api/admin/agencies
```

**Authentication**: Required (Supabase Auth)

**Request Body**:
```json
{
  "name": "Agency Name",
  "subdomain": "subdomain",
  "logo_url": "https://example.com/logo.png",
  "primary_color": "#059669",
  "secondary_color": "#0ea5e9"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Agency Name",
    "subdomain": "subdomain",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#059669",
    "secondary_color": "#0ea5e9",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### List Agencies
```
GET /api/admin/agencies
```

**Authentication**: Required

### Submit Form
```
POST /api/submissions
```

**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "agency_id": "uuid-or-null",
  "form_data": { /* form data object */ },
  "client_name": "John Doe",
  "num_travellers": 2,
  "route_preference": "trip-design"
}
```

## Subdomain Validation Rules

Subdomains must:
- Be 2-63 characters long
- Contain only lowercase letters, numbers, and hyphens
- Not start or end with a hyphen
- Not be a reserved subdomain (`www`, `api`, `admin`, `app`, `mail`, `ftp`, `localhost`)

## Branding Customization

Each agency can customize:
- **Logo**: Display at top of form
- **Primary Color**: Used for buttons, checkboxes, borders
- **Secondary Color**: Used for accents, highlights

Colors must be valid hex codes (e.g., `#059669`).

## Caching Strategy

- **Redis Cache**: Stores agency data for 1 hour
- **Cache Miss**: Falls back to Supabase database
- **No Redis**: App works without Redis (just slower)
- **Cache Invalidation**: Automatic on agency creation/update

## Security Features

✓ **RLS Policies**: Row-level security on all tables
✓ **Supabase Auth**: Required for admin operations
✓ **Zod Validation**: Input validation on all endpoints
✓ **Subdomain Validation**: Prevents malicious subdomains
✓ **HTTPS**: Enforced by Vercel
✓ **Rate Limiting**: Via Upstash Redis (optional)

## Troubleshooting

### Agency subdomain returns 404
- Check if agency exists in database
- Verify subdomain spelling
- Clear Redis cache: agency will be refetched

### Form submission fails
- Check browser console for errors
- Verify Supabase RLS policies are correct
- Ensure `form_submissions` table exists

### Local subdomain not working
- Use `.localhost` format: `wanderlust.localhost:3000`
- Try Chrome/Firefox (Safari may have issues)
- Check middleware logs in terminal

### Redis connection errors
- Verify environment variables are set
- App will work without Redis (just slower)
- Check Upstash dashboard for connection limits

## Architecture Overview

```
Request Flow:
1. User visits wanderlust.finestafrica.ai
2. Middleware extracts subdomain "wanderlust"
3. Checks Redis cache for agency
4. If not cached, queries Supabase
5. Rewrites to /agency/wanderlust
6. Page renders with agency branding
7. Form submission saves to Supabase + sends webhook
```

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check Vercel logs for deployment issues
3. Check browser console for client errors
4. Review middleware logs for routing issues

## Next Steps

1. Set up Supabase Auth for admin users
2. Create a admin dashboard to manage agencies
3. Add agency analytics and reporting
4. Implement custom domain support per agency
5. Add email notifications for submissions


