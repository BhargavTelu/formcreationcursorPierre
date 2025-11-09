import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use fallback values for build time, will throw error at runtime if not set
export const SUPABASE_URL: string = supabaseUrl || 'https://placeholder.supabase.co';
export const SUPABASE_ANON_KEY: string = supabaseKey || 'placeholder-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate at runtime (not during build)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  console.error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Client-side Supabase client (for browser)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Create a Supabase client for server-side operations
 * This is for use in Server Components, Route Handlers, and Server Actions
 */
export function createServerSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client with auth context from cookies
 * Use this in API routes that require authentication
 * NOTE: Only call this from Server Components or API routes
 */
export async function createAuthenticatedSupabaseClient() {
  // Import cookies only when this function is called (in a server context)
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
    },
  });

  // If we have tokens, set the session
  if (accessToken && refreshToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}

/**
 * Create a Supabase client with elevated service-role privileges.
 * Never expose this to the browser.
 */
export function createServiceSupabaseClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Get the current authenticated user from the request
 * NOTE: Only call this from Server Components or API routes
 */
export async function getCurrentUser() {
  const client = await createAuthenticatedSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Types for our Supabase tables
export interface Destination {
  id: string;
  name: string;
  parent_id: string | null;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Hotel {
  id: string;
  name: string;
  destination_id: string;  // Points to destinations.id (subregion)
  image_url: string;
  created_at?: string;
  updated_at?: string;
}
