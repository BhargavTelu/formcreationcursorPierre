import { NextRequest, NextResponse } from 'next/server';
import { getAgencyBySubdomain } from './lib/agency';

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'finestafrica.ai';

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function getSubdomain(hostname: string): string | null {
  if (!hostname) return null;

  // Handle localhost
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    return parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : null;
  }

  const host = hostname.split(':')[0].toLowerCase().trim();

  // Exact main domain → no subdomain
  if (host === MAIN_DOMAIN) return null;

  // www.maindomain.com → treat as root (no subdomain)
  if (host === `www.${MAIN_DOMAIN}`) return null;

  // Handle subdomains: subdomain.maindomain.com
  const parts = host.split('.');
  
  // Need at least 3 parts for a subdomain (subdomain.domain.tld)
  if (parts.length < 3) return null;

  // Get the subdomain (first part) and domain (last 2 parts)
  const subdomain = parts[0];
  const domain = parts.slice(-2).join('.');

  // Verify the domain matches our main domain
  if (domain !== MAIN_DOMAIN) return null;

  // If subdomain is 'www', treat as root (handled above, but double-check)
  if (subdomain === 'www') return null;

  return subdomain;
}

function shouldBypass(pathname: string): boolean {
  const bypass = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/static/',
    '/images/',
  ];
  return bypass.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Debug
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${hostname}${pathname}`);
  }

  // Bypass static/api
  if (shouldBypass(pathname)) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  // Bypass /agency routes
  if (pathname.startsWith('/agency/')) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  const subdomain = getSubdomain(hostname);

  // === NO SUBDOMAIN (main or www) → load default agency ===
  if (!subdomain) {
    // Optional: rewrite to /agency/default or just proceed
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  // === VALID SUBDOMAIN → check agency ===
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Checking agency for subdomain: ${subdomain} (hostname: ${hostname})`);
  }
  
  const agency = await getAgencyBySubdomain(subdomain);
  if (!agency) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Agency not found for subdomain: ${subdomain}`);
    }
    return new NextResponse(
      JSON.stringify({
        error: 'Agency not found',
        message: `The agency "${subdomain}" does not exist.`,
        subdomain,
        hostname,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Agency found: ${agency.name}, rewriting to /agency/${subdomain}${pathname}`);
  }

  // Rewrite to /agency/subdomain
  url.pathname = `/agency/${subdomain}${pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set('x-agency-subdomain', subdomain);
  res.headers.set('x-agency-id', agency.id);
  res.headers.set('x-agency-name', agency.name);
  addSecurityHeaders(res);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};