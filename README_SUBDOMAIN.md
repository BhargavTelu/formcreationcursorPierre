# Subdomain Multi-Tenancy - Quick Start Guide

## 🚀 Quick Start

Get your subdomain multi-tenancy system running in 5 minutes!

### 1. Run Database Migration

Open your Supabase SQL Editor and run:
```bash
supabase-migration.sql
```

This creates the `agencies` and `form_submissions` tables with proper security policies.

### 2. Set Up Environment Variables

Create `.env.local` in your project root:

```env
# Get from https://console.upstash.com/
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Your main domain (without https://)
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai
```

**Get Upstash Redis (Free Tier Available):**
1. Visit https://console.upstash.com/
2. Create account and new Redis database
3. Copy REST URL and Token
4. Paste into `.env.local`

### 3. Install Dependencies (if needed)

```bash
npm install
```

All required packages are already in package.json:
- `@upstash/redis` - Redis caching
- `zod` - Validation
- `slugify` - Subdomain generation

### 4. Start Development Server

```bash
npm run dev
```

### 5. Create Your First Agency

**Option A: Use the Admin Dashboard (Recommended)**

1. Go to http://localhost:3000/admin
2. Sign up for an admin account
3. Check your email and confirm
4. Sign in
5. Use the form to create an agency

**Option B: Use the API Directly**

First, authenticate with Supabase, then:

```javascript
const response = await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Wanderlust Travel',
    subdomain: 'wanderlust',
    logo_url: 'https://example.com/logo.png', // Optional
    primary_color: '#059669',
    secondary_color: '#0ea5e9',
  }),
});

const result = await response.json();
console.log(result);
```

### 6. Test Your Agency Subdomain

Visit: http://wanderlust.localhost:3000

You should see the branded travel form!

## 📁 Project Structure

```
├── middleware.ts                          # Subdomain routing
├── lib/
│   ├── agency.ts                          # Agency utilities
│   ├── redis.ts                           # Redis caching
│   ├── types.ts                           # TypeScript types
│   └── supabase.ts                        # Supabase client
├── app/
│   ├── page.tsx                           # Main domain form
│   ├── admin/page.tsx                     # Admin dashboard
│   ├── agency/[subdomain]/
│   │   ├── page.tsx                       # Agency-branded form
│   │   ├── layout.tsx                     # Agency layout
│   │   └── not-found.tsx                  # 404 page
│   └── api/
│       ├── admin/agencies/route.ts        # Create/list agencies
│       └── submissions/route.ts           # Store form submissions
├── components/
│   ├── AgencyForm.tsx                     # Branded form component
│   └── AdminAuth.tsx                      # Admin authentication
└── supabase-migration.sql                 # Database schema
```

## 🎨 How It Works

### Request Flow

```
1. User visits wanderlust.finestafrica.ai
   ↓
2. Middleware extracts subdomain "wanderlust"
   ↓
3. Checks Redis cache for agency data
   ↓
4. If not cached, queries Supabase
   ↓
5. Rewrites URL to /agency/wanderlust
   ↓
6. Page component fetches agency data
   ↓
7. Renders form with agency branding (colors, logo)
   ↓
8. Form submission → Supabase + Webhook
```

### Caching Strategy

- **Redis**: Stores agency data for 1 hour
- **Cache Hit**: Instant subdomain resolution
- **Cache Miss**: Falls back to Supabase (still fast)
- **No Redis**: App works fine, just slightly slower

## 🔐 Security Features

- ✅ **Row Level Security (RLS)**: Database-level permissions
- ✅ **Supabase Auth**: Required for agency creation
- ✅ **Zod Validation**: Input sanitization
- ✅ **Subdomain Validation**: Prevents malicious names
- ✅ **HTTPS Only**: Enforced by Vercel in production

## 🌐 Production Deployment

### Vercel Setup

1. **Deploy to Vercel:**
   ```bash
   vercel deploy
   ```

2. **Set Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `UPSTASH_REDIS_REST_URL`
   - Add `UPSTASH_REDIS_REST_TOKEN`
   - Add `NEXT_PUBLIC_APP_DOMAIN`

3. **Wildcard Domain:**
   - Vercel automatically supports `*.yourdomain.com`
   - Add domain in Project Settings → Domains
   - Update DNS with Vercel's nameservers

### DNS Configuration

Add these records to your domain:

```
Type    Name    Value
A       @       76.76.21.21 (Vercel's IP)
CNAME   *       cname.vercel-dns.com
```

## 📊 Admin Dashboard Features

Access at `/admin`:

- **Authentication**: Sign up/sign in with Supabase Auth
- **Create Agencies**: Visual form with color pickers
- **View Agencies**: Table of all agencies with links
- **Auto-slug Generation**: Subdomain auto-generated from name
- **Real-time Validation**: Instant feedback on inputs

## 🧪 Testing Subdomains Locally

### Built-in Support

Modern browsers support `.localhost` subdomains:

```
✅ http://wanderlust.localhost:3000
✅ http://safari.localhost:3000
✅ http://luxury.localhost:3000
```

### If That Doesn't Work

Edit your hosts file:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux:** `/etc/hosts`

Add:
```
127.0.0.1 wanderlust.localhost
127.0.0.1 safari.localhost
127.0.0.1 luxury.localhost
```

## 📡 API Reference

### Create Agency
```http
POST /api/admin/agencies
Authorization: Required (Supabase Auth)
Content-Type: application/json

{
  "name": "Agency Name",
  "subdomain": "agency-slug",
  "logo_url": "https://...",  // Optional
  "primary_color": "#059669",
  "secondary_color": "#0ea5e9"
}
```

### List Agencies
```http
GET /api/admin/agencies
Authorization: Required (Supabase Auth)
```

### Submit Form
```http
POST /api/submissions
Content-Type: application/json

{
  "agency_id": "uuid",  // or null
  "form_data": { ... },
  "client_name": "John Doe",
  "num_travellers": 2,
  "route_preference": "trip-design"
}
```

## 🎨 Customization

Each agency can customize:

| Element | Description | Field |
|---------|-------------|-------|
| Logo | Header image | `logo_url` |
| Primary Color | Buttons, checkboxes, borders | `primary_color` |
| Secondary Color | Accents, highlights | `secondary_color` |

Colors must be hex format: `#RRGGBB`

## 🐛 Troubleshooting

### Subdomain returns 404
```bash
# Check if agency exists
psql> SELECT * FROM agencies WHERE subdomain = 'wanderlust';

# Check middleware logs
# Look in terminal for "[Middleware]" messages
```

### Form submission fails
```bash
# Check RLS policies
psql> SELECT * FROM pg_policies WHERE tablename = 'form_submissions';

# Check browser console for errors
```

### Redis connection errors
```bash
# Verify environment variables
echo $UPSTASH_REDIS_REST_URL

# App will work without Redis (just slower)
# Check Upstash dashboard for rate limits
```

## 📈 Monitoring

### What to Monitor

1. **Redis Cache Hit Rate**: Should be >80%
2. **Subdomain Resolution Time**: Should be <100ms
3. **Form Submission Success Rate**: Should be >95%
4. **Database Query Performance**: Check Supabase logs

### Recommended Tools

- **Vercel Analytics**: Track subdomain performance
- **Supabase Dashboard**: Monitor database queries
- **Upstash Metrics**: Check cache hit rates

## 🔄 Migration from Existing System

If you already have agencies in another system:

1. Export agency data to CSV
2. Create import script:

```javascript
const agencies = [/* your data */];

for (const agency of agencies) {
  await fetch('/api/admin/agencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agency),
  });
}
```

## 📚 Additional Resources

- [SUBDOMAIN_SETUP.md](./SUBDOMAIN_SETUP.md) - Detailed setup guide
- [supabase-migration.sql](./supabase-migration.sql) - Database schema
- [middleware.ts](./middleware.ts) - Routing logic
- [lib/agency.ts](./lib/agency.ts) - Agency utilities

## 💬 Support

Need help?
1. Check the troubleshooting section above
2. Review Supabase logs for database errors
3. Check Vercel logs for deployment issues
4. Look for middleware logs in terminal

## ✅ Checklist

- [ ] Ran database migration in Supabase
- [ ] Set up Upstash Redis account
- [ ] Added environment variables to `.env.local`
- [ ] Started development server
- [ ] Created admin account
- [ ] Created first test agency
- [ ] Tested subdomain locally
- [ ] Submitted test form
- [ ] Verified data in Supabase
- [ ] Ready for production deployment!

---

**🎉 Congratulations!** Your multi-tenant subdomain system is ready to use!


