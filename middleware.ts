import { NextRequest, NextResponse } from 'next/server';
import { getAgencyBySubdomain } from './lib/agency';

// Define the main domain from environment or fallback
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'finestafrica.ai';

/**
 * Extract subdomain from hostname
 */
function getSubdomain(hostname: string): string | null {
  // Handle localhost for development
  if (hostname.includes('localhost')) {
    // Format: subdomain.localhost:3000 or subdomain.localhost
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'localhost') {
      return parts[0];
    }
    return null;
  }

  // Production: subdomain.finestafrica.ai
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // Check if we have a subdomain
  // Format: subdomain.finestafrica.ai (3 parts)
  // Main domain: finestafrica.ai (2 parts)
  if (parts.length >= 3) {
    // Get the subdomain (first part)
    const subdomain = parts[0];
    
    // Verify the rest matches the main domain
    const domain = parts.slice(-2).join('.');
    if (domain === MAIN_DOMAIN) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Check if the path should bypass subdomain logic
 */
function shouldBypass(pathname: string): boolean {
  const bypassPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/static/',
    '/images/',
  ];

  return bypassPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Bypass middleware for certain paths
  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  // If already on an agency route, don't rewrite
  if (pathname.startsWith('/agency/')) {
    return NextResponse.next();
  }

  // Extract subdomain
  const subdomain = getSubdomain(hostname);

  // No subdomain = main domain, continue normally
  if (!subdomain) {
    return NextResponse.next();
  }

  console.log(`[Middleware] Detected subdomain: ${subdomain}`);

  // Check if agency exists
  const agency = await getAgencyBySubdomain(subdomain);

  if (!agency) {
    console.log(`[Middleware] Agency not found for subdomain: ${subdomain}`);
    // Return 404 or redirect to main site
    return new NextResponse(
      JSON.stringify({
        error: 'Agency not found',
        message: `The agency "${subdomain}" does not exist.`,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  console.log(`[Middleware] Agency found: ${agency.name}, rewriting to /agency/${subdomain}${pathname}`);

  // Rewrite to the agency route
  const url = request.nextUrl.clone();
  url.pathname = `/agency/${subdomain}${pathname}`;

  // Add agency data as headers for the request
  const response = NextResponse.rewrite(url);
  response.headers.set('x-agency-subdomain', subdomain);
  response.headers.set('x-agency-id', agency.id);
  response.headers.set('x-agency-name', agency.name);

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


