# Finest Africa – Travel Planning Form + Admin/Agency Portal

This repository is a **Next.js 14 (App Router)** application that powers:

- A **public travel planning form** (`/`) that stores submissions in Supabase and triggers an external automation webhook.
- An **admin portal** for managing agencies and inviting admins (Supabase Auth + `profiles` / `invitations` tables).
- An **agency portal** (per subdomain) with its own login/session system and a dashboard to review submissions.

The application is designed around **subdomain-based routing**: requests to `https://{agency-subdomain}.{domain}` are rewritten to the agency pages under `/agency/[subdomain]` by `middleware.ts`.

## Core features

- **Public travel planning form**
  - Collects trip preferences (route type, months/date, destinations/hotels, etc.).
  - Persists the submission to `form_submissions` via `POST /api/submissions`.
  - Forwards the payload to an external workflow engine via `POST /api/webhooks/n8n`.

- **Admin portal**
  - **Admin login** at `/login` via `POST /api/auth/login` (Supabase Auth).
  - **Agency management** at `/admin/dashboard` via `GET/POST /api/admin/agencies`.
  - **Admin invitations** at `/admin/invite` via `POST /api/admin/invite` (tokenized invite emails).
  - **Invite accept** UI at `/invite/accept?token=...` which activates admin access and signs in.

- **Agency portal (per agency)**
  - Agency login at `/agency/[subdomain]/login` via `POST /api/agency/auth/login`.
  - Agency dashboard at `/agency/[subdomain]/dashboard` that loads submissions via `GET /api/submissions?agency_id=...`.
  - Forgot/reset password flow for agency users (`/agency/[subdomain]/forgot-password`, `/reset-password`).
  - Submission success screen (`/agency/[subdomain]/submission-success`).

## Tech stack

- **Next.js 14.2** (App Router, Route Handlers)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
  - Supabase Auth (admins)
  - Postgres tables for agencies, submissions, and agency auth
- **Upstash Redis** (optional caching for agency lookup)
- **Resend** (optional email delivery for admin invites and agency password resets)
- **zod** for runtime validation in API routes

## Runtime architecture & data flow (high level)

### Subdomain routing

`middleware.ts` inspects the `Host` header:

- If the request is to the **main domain** (or `www`) → it is not rewritten.
- If the request is to `subdomain.{NEXT_PUBLIC_APP_DOMAIN}` (or `subdomain.localhost` in dev) → it:
  - looks up the agency via `lib/agency.getAgencyBySubdomain()`
  - rewrites the request to `/agency/{subdomain}{pathname}`
  - attaches `x-agency-*` headers for debugging/observability

### Admin authentication (Supabase Auth)

- `POST /api/auth/login` validates credentials using Supabase Auth.
- It then verifies the user is an **admin** by querying `public.profiles` and checking `role === 'admin'`.
- Session tokens are stored as **HTTP-only cookies**:
  - `sb-access-token`
  - `sb-refresh-token`
- Server components and API routes enforce access via `lib/auth.requireAdmin()`.

### Admin invitations

- `POST /api/admin/invite`:
  - generates a random token (`lib/invitations`)
  - stores **only the token hash** in `public.invitations`
  - sends an email via `lib/email.sendAdminInviteEmail()` (Resend)
- `/invite/accept`:
  - `GET /api/invite/validate` validates token hash + status + expiry
  - `POST /api/invite/accept` creates/updates the Supabase Auth user and upgrades `public.profiles.role` to `admin`
  - sets `sb-access-token` / `sb-refresh-token` cookies for immediate login

### Agency authentication (custom tables)

Agency users are **not** Supabase Auth users. They live in:

- `public.agency_users` (one active user per agency)
- `public.agency_sessions` (server-issued session tokens)
- `public.agency_password_reset_tokens` (one-time reset tokens)

Login flow:

- `POST /api/agency/auth/login` verifies credentials against `agency_users.password_hash`
  - New hashes are **bcrypt**
  - Legacy SHA-256 hashes are still accepted and upgraded to bcrypt on successful login
- On success, a random session token is created and stored **hashed** in `agency_sessions`
- The raw token is stored in an **HTTP-only cookie**: `agency-session-token`
- Server components validate it via `lib/agency-auth.validateAgencySession()`

### Submissions

- `POST /api/submissions` stores the submission in `public.form_submissions`
  - core fields are copied into columns (e.g. `client_name`, `route_preference`)
  - all remaining data is stored in `form_data` JSON
- `GET /api/submissions?agency_id=...` lists submissions for an agency

### Webhook forwarding

Client code never calls the external webhook directly. Instead it posts to:

- `POST /api/webhooks/n8n`

This route chooses which webhook URL to call based on `routePreference` and forwards the payload server-side, keeping webhook URLs out of the browser bundle.

## Folder structure

```
formcreation/
├── app/                          # Next.js App Router pages + route handlers
│   ├── (admin-protected)/admin/  # Admin-only UI (guarded in layout.tsx)
│   ├── agency/[subdomain]/       # Agency portal pages (login, form, dashboard)
│   ├── api/                      # Route Handlers (admin/auth/agency/submissions/webhooks)
│   ├── invite/accept/            # Admin invite acceptance page
│   └── login/                    # Admin login page
├── components/                   # Client components (forms, dashboards, UI)
├── lib/                          # Supabase, auth helpers, email, caching, types
├── scripts/                      # Helper scripts (local/dev ops)
├── *.sql                         # Supabase SQL scripts used to create required tables/policies
└── middleware.ts                 # Subdomain rewrite + security headers
```

## Setup & installation

### Prerequisites

- Node.js 18+
- A Supabase project (Postgres + Auth enabled)
- Optional: Resend account for email delivery
- Optional: Upstash Redis for caching agency lookups

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create `.env.local` (not committed) with the variables used by this repository:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Domain / URL configuration (recommended)
NEXT_PUBLIC_APP_DOMAIN=finestafrica.ai
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Webhook forwarding (required if you expect webhook delivery)
N8N_WEBHOOK_PREDEFINED_URL=
N8N_WEBHOOK_TRIP_DESIGN_URL=

# Email delivery (optional)
RESEND_API_KEY=
INVITE_EMAIL_FROM=Finest Africa <admin@finestafrica.ai>

# Optional caching (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: one-time bootstrap admin endpoint
BOOTSTRAP_SECRET=
```

### Database setup (Supabase SQL Editor)

This repository includes SQL scripts for:

- **Admin + invitation system**: `supabase-admin-security.sql`
  - creates `public.profiles` + `public.invitations`
  - adds trigger `handle_new_user()` on `auth.users` inserts
  - enables RLS and policies for admin management

- **Agency authentication system**: `agency-auth-complete.sql`
  - creates `public.agency_users`, `public.agency_sessions`, `public.agency_password_reset_tokens`
  - enables RLS (service-role policies for server operations)

Run (in Supabase SQL editor) in this order:

1. `supabase-admin-security.sql`
2. `agency-auth-complete.sql`

### Important: additional tables required

The application code also depends on tables that are **not created by the SQL scripts in this repository**:

- `public.agencies` (used by `lib/agency` and admin agency creation)
- `public.form_submissions` (used by `app/api/submissions`)
- `public.destinations` and `public.hotels` (used by `components/DestinationTree` via the client-side Supabase SDK)

If your Supabase project does not already have these tables, the app will fail at runtime (e.g. agency lookup, submissions, destination selector). This repository currently does not ship migrations for those tables.

## Running locally

```bash
npm run dev
```

- Main app: `http://localhost:3000`
- Simulated subdomains on localhost:
  - `http://{subdomain}.localhost:3000` → rewritten to `/agency/{subdomain}`

## Helper scripts

### Create the first admin

There are two supported approaches:

- **Bootstrap API route**: `POST /api/bootstrap-admin` (requires `BOOTSTRAP_SECRET`)
- **Node script**: `scripts/setup-super-admin.js` (requires env vars)

For the script, set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

Then run:

```bash
node scripts/setup-super-admin.js
```

### Create test agencies (optional)

`scripts/create-test-agencies.js` posts to `POST /api/admin/agencies`. It assumes you’re already authenticated as an admin (it does not inject cookies automatically).

## Security notes

- **No `.env` files are tracked by git** (`.gitignore` excludes `.env*`).
- **Webhook URLs are server-only** via `/api/webhooks/n8n` and the `N8N_WEBHOOK_*` env vars.
- **Supabase service role key must never be exposed to the browser**. It is used only in server route handlers.
- **Agency passwords** are stored as bcrypt hashes; legacy SHA-256 hashes (if any) are accepted and upgraded on login.

## Production readiness notes

- Set `NEXT_PUBLIC_APP_DOMAIN` to your apex domain (used by `middleware.ts` for subdomain validation).
- Set `NEXT_PUBLIC_APP_URL` / `APP_URL` to the canonical base URL (used for invitation/reset links).
- Cookies are marked `secure` automatically when `NODE_ENV === 'production'`.
- Upstash Redis is optional; if not configured, agency lookups fall back to DB without caching.

