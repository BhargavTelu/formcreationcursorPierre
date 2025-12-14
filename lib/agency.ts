import { supabase, createServerSupabaseClient } from './supabase';
import { getCached, setCached, deleteCached, cacheKeys, cacheTTL } from './redis';
import type { Agency } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch agency by subdomain from cache or database
 */
export async function getAgencyBySubdomain(subdomain: string): Promise<Agency | null> {
  // Normalize subdomain to lowercase
  const normalizedSubdomain = subdomain.toLowerCase().trim();

  // Try cache first
  const cacheKey = cacheKeys.agency(normalizedSubdomain);
  const cached = await getCached<Agency>(cacheKey);

  if (cached) {
    console.log(`[Agency] Cache hit for subdomain: ${normalizedSubdomain}`);
    return cached;
  }

  console.log(`[Agency] Cache miss for subdomain: ${normalizedSubdomain}, fetching from DB`);

  // Fetch from database
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('subdomain', normalizedSubdomain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log(`[Agency] Not found: ${normalizedSubdomain}`);
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    // Cast to Agency type
    const agency = data as Agency;

    // Cache the result
    await cacheAgency(normalizedSubdomain, agency);

    return agency;
  } catch (error) {
    console.error('[Agency] Error fetching agency:', error);
    return null;
  }
}

/**
 * Cache agency data
 */
export async function cacheAgency(subdomain: string, agency: Agency): Promise<boolean> {
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  const cacheKey = cacheKeys.agency(normalizedSubdomain);

  try {
    await setCached(cacheKey, agency, cacheTTL.agency);
    console.log(`[Agency] Cached agency: ${normalizedSubdomain}`);
    return true;
  } catch (error) {
    console.error('[Agency] Error caching agency:', error);
    return false;
  }
}

/**
 * Invalidate agency cache
 */
export async function invalidateAgencyCache(subdomain: string): Promise<boolean> {
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  const cacheKey = cacheKeys.agency(normalizedSubdomain);

  try {
    await deleteCached(cacheKey);
    console.log(`[Agency] Invalidated cache for: ${normalizedSubdomain}`);
    return true;
  } catch (error) {
    console.error('[Agency] Error invalidating cache:', error);
    return false;
  }
}

/**
 * Check if subdomain is available
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const normalizedSubdomain = subdomain.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('subdomain')
      .eq('subdomain', normalizedSubdomain)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned, subdomain is available
      return true;
    }

    // If we got data, subdomain is taken
    return !data;
  } catch (error) {
    console.error('[Agency] Error checking subdomain availability:', error);
    return false;
  }
}

/**
 * Get all agencies (for admin purposes)
 */
export async function getAllAgencies(): Promise<Agency[]> {
  try {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Agency[];
  } catch (error) {
    console.error('[Agency] Error fetching all agencies:', error);
    return [];
  }
}

/**
 * Create a new agency
 * @param agencyData - Agency data to create
 * @param supabaseClient - Optional authenticated Supabase client (for server-side use)
 */
export async function createAgency(
  agencyData: {
    name: string;
    subdomain: string;
    email: string;
    logo_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
    created_by?: string;
  },
  supabaseClient?: SupabaseClient
): Promise<{ success: boolean; agency?: Agency; error?: string }> {
  const normalizedSubdomain = agencyData.subdomain.toLowerCase().trim();

  // Use provided client or default to the regular client
  const client = supabaseClient || supabase;

  // Check if subdomain is available
  const available = await isSubdomainAvailable(normalizedSubdomain);
  if (!available) {
    return { success: false, error: 'Subdomain is already taken' };
  }

  try {
    const { data, error } = await client
      .from('agencies')
      .insert({
        name: agencyData.name,
        subdomain: normalizedSubdomain,
        email: agencyData.email,
        logo_url: agencyData.logo_url || null,
        primary_color: agencyData.primary_color || '#059669',
        secondary_color: agencyData.secondary_color || '#0ea5e9',
        created_by: agencyData.created_by || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[Agency] Supabase error creating agency:', error);
      console.error('[Agency] Error code:', error.code);
      console.error('[Agency] Error details:', error.details);
      
      // Return more specific error messages
      if (error.code === '42P01') {
        return { success: false, error: 'Database table does not exist. Please run the migration script.' };
      } else if (error.code === '23505') {
        return { success: false, error: 'Subdomain is already taken' };
      } else if (error.code === '42501') {
        return { success: false, error: 'Permission denied. RLS policy issue. Check authentication.' };
      } else if (error.message) {
        return { success: false, error: `Database error: ${error.message}` };
      }
      
      throw error;
    }

    const agency = data as Agency;

    // Cache the new agency
    await cacheAgency(normalizedSubdomain, agency);

    return { success: true, agency };
  } catch (error: any) {
    console.error('[Agency] Error creating agency:', error);
    return { success: false, error: error?.message || 'Failed to create agency' };
  }
}


