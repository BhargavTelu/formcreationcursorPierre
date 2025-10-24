import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiosxmvocybjwomejymg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppb3N4bXZvY3liandvbWVqeW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTg2NjQsImV4cCI6MjA3NDk5NDY2NH0.y6Xl5BPnRlU-nZMkSmq-L1tKb9YZKuO_90jOq1jDK2k';

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Create a Supabase client for server-side operations
 * This is for use in Server Components, Route Handlers, and Server Actions
 */
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
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

  const client = createClient(supabaseUrl, supabaseKey, {
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
