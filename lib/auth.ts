import type { User } from '@supabase/supabase-js';
import { createAuthenticatedSupabaseClient } from './supabase';
import type { Profile } from './types';

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  status = 403;

  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

type SupabaseAuthedClient = Awaited<ReturnType<typeof createAuthenticatedSupabaseClient>>;

type SessionProfileResult = {
  client: SupabaseAuthedClient;
  user: User | null;
  profile: Profile | null;
};

export async function getSessionWithProfile(): Promise<SessionProfileResult> {
  const client = await createAuthenticatedSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return { client, user: null, profile: null };
  }

  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1);

  if (profileError) {
    console.error('[Auth] Failed to load profile for user', user.id, profileError);
    return { client, user, profile: null };
  }

  const profile = Array.isArray(profiles) && profiles.length > 0 ? (profiles[0] as Profile) : null;

  return { client, user, profile };
}

export async function requireAuthenticatedUser() {
  const session = await getSessionWithProfile();

  if (!session.user) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireAdmin() {
  const session = await getSessionWithProfile();

  if (!session.user) {
    throw new UnauthorizedError();
  }

  if (!session.profile || session.profile.role !== 'admin') {
    throw new ForbiddenError('Administrator privileges required');
  }

  return session;
}

