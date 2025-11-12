/**
 * Simple in-memory rate limiting for API endpoints
 * For production, use a distributed solution like Redis or Upstash Rate Limit
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  maxRequests: number;
  
  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  error?: string;
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., user ID, IP address, email)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `ratelimit:${identifier}`;

  // Get or initialize the rate limit entry
  let entry = store[key];

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    store[key] = entry;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
      error: 'Rate limit exceeded',
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Admin invitation sending - 10 invites per hour per admin
  adminInvite: {
    maxRequests: 10,
    windowSeconds: 3600, // 1 hour
  },
  
  // Admin login attempts - 5 attempts per 15 minutes
  adminLogin: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
  },
  
  // Accept invitation attempts - 3 attempts per 10 minutes
  acceptInvitation: {
    maxRequests: 3,
    windowSeconds: 600, // 10 minutes
  },
  
  // Agency creation - 20 per hour per admin
  createAgency: {
    maxRequests: 20,
    windowSeconds: 3600, // 1 hour
  },
  
  // General admin API - 100 requests per minute
  adminApi: {
    maxRequests: 100,
    windowSeconds: 60, // 1 minute
  },
};

/**
 * Helper to format rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetDate = new Date(result.resetAt).toISOString();
  
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': resetDate,
  };
}

/**
 * Middleware-style rate limit checker for API routes
 * 
 * Usage:
 * ```typescript
 * const rateLimitResult = await rateLimitMiddleware(request, 'admin-invite', adminUser.id);
 * if (!rateLimitResult.success) {
 *   return NextResponse.json(
 *     { error: rateLimitResult.error },
 *     { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
 *   );
 * }
 * ```
 */
export async function rateLimitMiddleware(
  request: Request,
  type: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  return checkRateLimit(identifier, config);
}

/**
 * Production-ready rate limiting with Upstash Redis
 * Uncomment and configure when ready for production
 * 
 * Requirements:
 * 1. npm install @upstash/ratelimit @upstash/redis
 * 2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
 */

/*
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const productionRateLimits = {
  adminInvite: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  }),
  
  adminLogin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  }),
  
  createAgency: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  }),
};

export async function productionRateLimitMiddleware(
  type: keyof typeof productionRateLimits,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = productionRateLimits[type];
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.reset,
    error: result.success ? undefined : 'Rate limit exceeded',
  };
}
*/







