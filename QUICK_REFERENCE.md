# Quick Reference Card

## 🚀 3-Step Setup

```bash
# 1. Run migration in Supabase SQL Editor
supabase-migration.sql

# 2. Create .env.local
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai

# 3. Start server
npm run dev
```

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| Main site | http://localhost:3000 |
| Admin dashboard | http://localhost:3000/admin |
| Test agency | http://wanderlust.localhost:3000 |
| Create agency API | POST /api/admin/agencies |
| List agencies API | GET /api/admin/agencies |
| Submit form API | POST /api/submissions |

## 📁 New Files Created (22 total)

### Core Implementation
- ✅ `middleware.ts` - Subdomain routing
- ✅ `lib/agency.ts` - Agency utilities  
- ✅ `lib/redis.ts` - Redis caching
- ✅ `lib/types.ts` - TypeScript types
- ✅ `lib/supabase.ts` - Updated with server helpers

### API Endpoints
- ✅ `app/api/admin/agencies/route.ts` - Create/list agencies
- ✅ `app/api/submissions/route.ts` - Store form data

### Agency Routes
- ✅ `app/agency/[subdomain]/page.tsx` - Agency page
- ✅ `app/agency/[subdomain]/layout.tsx` - Agency layout
- ✅ `app/agency/[subdomain]/not-found.tsx` - 404 page

### Components
- ✅ `components/AgencyForm.tsx` - Branded form
- ✅ `components/AdminAuth.tsx` - Auth component

### Admin Interface
- ✅ `app/admin/page.tsx` - Admin dashboard

### Updated Files
- ✅ `app/page.tsx` - Added submission storage

### Database
- ✅ `supabase-migration.sql` - Schema + RLS policies

### Documentation
- ✅ `SUBDOMAIN_SETUP.md` - Detailed setup
- ✅ `README_SUBDOMAIN.md` - Quick start
- ✅ `TESTING.md` - Test procedures
- ✅ `IMPLEMENTATION_COMPLETE.md` - Full summary
- ✅ `QUICK_REFERENCE.md` - This file

### Scripts
- ✅ `scripts/create-test-agencies.js` - Test data

## 🔑 Environment Variables

```env
# Required for caching (optional, app works without)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Required for subdomain detection
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai

# Optional: Extra API security
ADMIN_API_KEY=your_secret_key
```

## 🎨 Agency Branding Fields

```javascript
{
  name: "Agency Name",           // Required
  subdomain: "agency-slug",      // Required, unique, lowercase
  logo_url: "https://...",       // Optional
  primary_color: "#059669",      // Optional, default emerald
  secondary_color: "#0ea5e9"     // Optional, default sky blue
}
```

## 📊 Database Tables

### agencies
- `id` (UUID) - Primary key
- `name` (text) - Agency name
- `subdomain` (text) - Unique subdomain
- `logo_url` (text) - Logo URL (nullable)
- `primary_color` (text) - Hex color
- `secondary_color` (text) - Hex color
- `created_at`, `updated_at` - Timestamps
- `created_by` (UUID) - User who created it

### form_submissions
- `id` (UUID) - Primary key
- `agency_id` (UUID) - References agencies (nullable)
- `form_data` (jsonb) - Complete form data
- `client_name` (text) - Client name
- `num_travellers` (int) - Number of travelers
- `route_preference` (text) - Route type
- `webhook_sent` (bool) - Webhook status
- `created_at` - Timestamp

## 🔐 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Supabase Auth for admin operations
- ✅ Zod validation on all inputs
- ✅ Subdomain format validation
- ✅ Reserved subdomain protection
- ✅ HTTPS enforced in production

## 🧪 Quick Test Commands

```javascript
// In browser console after signing in to /admin:

// Create test agency
await fetch('/api/admin/agencies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Agency',
    subdomain: 'test',
    primary_color: '#059669',
    secondary_color: '#0ea5e9'
  })
});

// List all agencies
await fetch('/api/admin/agencies').then(r => r.json());

// Test subdomain
window.open('http://test.localhost:3000');
```

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Subdomain 404 | Check agency exists, restart server |
| Can't create agency | Ensure signed in via /admin |
| Redis errors | Check env vars, app works without Redis |
| Form won't submit | Check browser console, verify RLS policies |

## 🎯 Common Tasks

### Create Agency via Dashboard
1. Go to http://localhost:3000/admin
2. Sign up / Sign in
3. Fill form
4. Click "Create Agency"

### Test Agency Subdomain
```
http://[subdomain].localhost:3000
```

### View Submissions in Supabase
```sql
SELECT * FROM form_submissions 
ORDER BY created_at DESC;
```

### Clear Redis Cache
Restart server or delete from Upstash dashboard

## 📈 Performance Targets

- Subdomain resolution (cached): < 50ms
- Subdomain resolution (uncached): < 200ms  
- Form submission: < 500ms
- Redis cache hit rate: > 80%

## 🌐 Production Checklist

- [ ] Run migration in production Supabase
- [ ] Set up production Upstash Redis
- [ ] Configure env vars in Vercel
- [ ] Add wildcard domain (*.finestafrica.ai)
- [ ] Deploy code to Vercel
- [ ] Create first production agency
- [ ] Test production subdomain
- [ ] Verify SSL certificate active

## 📚 Documentation Files

- **Quick Start**: `README_SUBDOMAIN.md`
- **Detailed Setup**: `SUBDOMAIN_SETUP.md`
- **Testing Guide**: `TESTING.md`
- **Full Implementation**: `IMPLEMENTATION_COMPLETE.md`
- **This Card**: `QUICK_REFERENCE.md`

## 🆘 Get Help

1. Check browser console for errors
2. Review Supabase logs
3. Check Vercel deployment logs
4. Verify Upstash Redis dashboard
5. Review middleware logs in terminal
6. Read documentation files

---

**Keep this card handy for quick reference!** 📌


