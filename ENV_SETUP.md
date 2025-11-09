# Environment Variables Setup

This document describes all environment variables required for the application to run properly.

## Required Environment Variables

### Supabase Configuration (REQUIRED)

These are required for database operations:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=service-role-key-from-supabase
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "anon/public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server-side only)

### Application Configuration (REQUIRED)

```bash
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai
NEXT_PUBLIC_APP_URL=https://www.finestafrica.ai
```

This should match your production domain (without www or protocol).

### Email Delivery (Optional but recommended for admin invitations)

```bash
RESEND_API_KEY=your-resend-api-key
INVITE_EMAIL_FROM="Finest Africa <admin@finestafrica.ai>"
BOOTSTRAP_SECRET=super-secure-random-bootstrap-secret
```

If `RESEND_API_KEY` is unset, the system will still generate invitation links but will instruct admins to copy and send them manually.

## Optional Environment Variables

### Redis Configuration (Optional - for caching)

If you want to enable caching with Redis:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

**Note:** The application will work without Redis, but it will be slower as it won't cache agency data.

## Local Development Setup

1. Create a `.env.local` file in the root of the project
2. Copy the variables from above and fill in your values
3. Never commit `.env.local` to git (it's already in `.gitignore`)

## Production Setup (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable with its corresponding value
4. Make sure to add them for "Production", "Preview", and "Development" environments

## Verifying Your Setup

After setting up environment variables:

1. **Local Development:**
   ```bash
   npm run dev
   ```
   If you see errors about missing environment variables, check your `.env.local` file.

2. **Production:**
   - Deploy to Vercel
   - Check the deployment logs for any environment variable errors
   - Visit your site and check the browser console for errors

## Security Notes

- **NEVER** commit `.env.local` or any file containing actual credentials to git
- **NEVER** hardcode credentials in your source code
- The `NEXT_PUBLIC_` prefix makes variables available to the browser - only use it for non-sensitive data
- Keep your Supabase anon key safe - it should only have Row Level Security (RLS) protected access

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- In local development, make sure they're in `.env.local`
- In production (Vercel), make sure they're set in project settings

### Redis warnings in console
- This is normal if you haven't set up Redis
- The app will work fine without Redis, just without caching
- To enable caching, add the Upstash Redis variables

### Subdomain routing not working
- Check that `NEXT_PUBLIC_APP_DOMAIN` matches your production domain
- Make sure DNS is configured correctly for wildcard subdomains

