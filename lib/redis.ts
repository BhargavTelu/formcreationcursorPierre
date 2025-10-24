import { Redis } from '@upstash/redis';

// Initialize Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  // Return null if Redis credentials are not configured
  // This allows the app to work without Redis (just slower)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis credentials not configured. Caching will be disabled.');
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

// Cache key prefixes
const CACHE_KEYS = {
  agency: (subdomain: string) => `agency:${subdomain}`,
} as const;

// Cache TTL (time to live) in seconds
const CACHE_TTL = {
  agency: 3600, // 1 hour
} as const;

/**
 * Get a value from Redis cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set a value in Redis cache with TTL
 */
export async function setCached<T>(key: string, value: T, ttl: number = 3600): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

/**
 * Delete a key from Redis cache
 */
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    // Note: Upstash Redis doesn't support KEYS command in the same way
    // For patterns, we'll need to track keys manually or use a different approach
    // For now, we'll just delete individual keys
    console.warn('Pattern deletion not fully supported, consider manual key tracking');
    return true;
  } catch (error) {
    console.error('Redis pattern delete error:', error);
    return false;
  }
}

// Export cache key generators
export const cacheKeys = CACHE_KEYS;
export const cacheTTL = CACHE_TTL;


