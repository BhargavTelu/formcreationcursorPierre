// import { NextRequest, NextResponse } from 'next/server';
// import { getAgencyBySubdomain } from './lib/agency';

// // Define the main domain from environment or fallback
// const MAIN_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'finestafrica.ai';

// /**
//  * Add security headers to response
//  */
// function addSecurityHeaders(response: NextResponse): void {
//   // Prevent clickjacking
//   response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
//   // Prevent MIME type sniffing
//   response.headers.set('X-Content-Type-Options', 'nosniff');
  
//   // XSS Protection
//   response.headers.set('X-XSS-Protection', '1; mode=block');
  
//   // Referrer Policy
//   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
//   // Permissions Policy (restrict features)
//   response.headers.set(
//     'Permissions-Policy',
//     'camera=(), microphone=(), geolocation=()'
//   );
// }

// /**
//  * Extract subdomain from hostname
//  */
// function getSubdomain(hostname: string): string | null {
//   // Handle localhost for development
//   if (hostname.includes('localhost')) {
//     // Format: subdomain.localhost:3000 or subdomain.localhost
//     const parts = hostname.split('.');
//     if (parts.length >= 2 && parts[0] !== 'localhost') {
//       return parts[0];
//     }
//     return null;
//   }

//   // Remove port if present
//   const host = hostname.split(':')[0];
  
//   // Check if this is the main domain exactly
//   if (host === MAIN_DOMAIN) {
//     return null; // Main domain has no subdomain
//   }
  
//   // Check if this is www.main-domain
//   if (host === `www.${MAIN_DOMAIN}`) {
//     return 'www';
//   }
  
//   // For other potential subdomains
//   const parts = host.split('.');
  
//   // Check if we have a subdomain pattern
//   if (parts.length >= 3) {
//     // Get the subdomain (first part)
//     const subdomain = parts[0];
    
//     // Verify the rest matches the main domain
//     const domain = parts.slice(-2).join('.');
//     if (domain === MAIN_DOMAIN) {
//       return subdomain;
//     }
//   }

//   return null;
// }

// /**
//  * Check if the path should bypass subdomain logic
//  */
// function shouldBypass(pathname: string): boolean {
//   const bypassPaths = [
//     '/api/',
//     '/_next/',
//     '/favicon.ico',
//     '/robots.txt',
//     '/sitemap.xml',
//     '/static/',
//     '/images/',
//   ];

//   return bypassPaths.some((path) => pathname.startsWith(path));
// }

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const hostname = request.headers.get('host') || '';

//   // Add debug logging for development
//   if (process.env.NODE_ENV === 'development') {
//     console.log(`[Middleware] Request to: ${hostname}${pathname}`);
//   }

//   // Bypass middleware for certain paths
//   if (shouldBypass(pathname)) {
//     const response = NextResponse.next();
//     // Add security headers even for bypassed paths
//     addSecurityHeaders(response);
//     return response;
//   }

//   // If already on an agency route, don't rewrite
//   if (pathname.startsWith('/agency/')) {
//     const response = NextResponse.next();
//     addSecurityHeaders(response);
//     return response;
//   }

//   // Extract subdomain
//   const subdomain = getSubdomain(hostname);

//   // CRITICAL: If we're already on the main domain (no subdomain), never redirect
//   // This prevents any redirect loops
//   if (!subdomain) {
//     const response = NextResponse.next();
//     addSecurityHeaders(response);
//     return response;
//   }

//   // Handle www subdomain by redirecting to main domain
//   // This is the ONLY redirect we do - www → main domain
//   if (subdomain === 'www' && hostname.startsWith('www.')) {
//     // Always use HTTPS for redirect (Vercel handles HTTP → HTTPS automatically)
//     // Build absolute URL to ensure clean redirect without loops
//     const redirectUrl = new URL(pathname + (request.nextUrl.search || ''), `https://${MAIN_DOMAIN}`);
    
//     // Add debug logging
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`[Middleware] Redirecting www (${hostname}) to: ${redirectUrl.toString()}`);
//     }
    
//     // Create permanent redirect (301)
//     const response = NextResponse.redirect(redirectUrl, 301);
    
//     // Add cache control headers to prevent browsers from caching redirect loops
//     response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     response.headers.set('Pragma', 'no-cache');
//     response.headers.set('Expires', '0');
//     addSecurityHeaders(response);
    
//     return response;
//   }

//   console.log(`[Middleware] Detected subdomain: ${subdomain}`);

//   // Check if agency exists
//   const agency = await getAgencyBySubdomain(subdomain);

//   if (!agency) {
//     console.log(`[Middleware] Agency not found for subdomain: ${subdomain}`);
//     // Return 404 or redirect to main site
//     return new NextResponse(
//       JSON.stringify({
//         error: 'Agency not found',
//         message: `The agency "${subdomain}" does not exist.`,
//       }),
//       {
//         status: 404,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//   }

//   console.log(`[Middleware] Agency found: ${agency.name}, rewriting to /agency/${subdomain}${pathname}`);

//   // Rewrite to the agency route
//   const url = request.nextUrl.clone();
//   url.pathname = `/agency/${subdomain}${pathname}`;

//   // Add agency data as headers for the request
//   const response = NextResponse.rewrite(url);
//   response.headers.set('x-agency-subdomain', subdomain);
//   response.headers.set('x-agency-id', agency.id);
//   response.headers.set('x-agency-name', agency.name);
  
//   // Add security headers
//   addSecurityHeaders(response);

//   return response;
// }

// // Configure which routes use this middleware
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public files (public folder)
//      */
//     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };


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

  const host = hostname.split(':')[0].toLowerCase();

  // Exact main domain → no subdomain
  if (host === MAIN_DOMAIN) return null;

  // www.maindomain.com → treat as root
  if (host === `www.${MAIN_DOMAIN}`) return null; // ← CHANGED: www = root

  const parts = host.split('.');
  if (parts.length < 3) return null;

  const subdomain = parts[0];
  const domain = parts.slice(-2).join('.');
  return domain === MAIN_DOMAIN ? subdomain : null;
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
  const agency = await getAgencyBySubdomain(subdomain);
  if (!agency) {
    return new NextResponse(
      JSON.stringify({
        error: 'Agency not found',
        message: `The agency "${subdomain}" does not exist.`,
      }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
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