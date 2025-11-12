import { createServiceSupabaseClient, SUPABASE_URL } from './supabase';
import type { AgencyUser, AgencyUserWithAgency } from './types';
import { createHash, randomBytes } from 'crypto';

/**
 * Hash a password using SHA-256 (for agency users)
 * In production, consider using bcrypt or Argon2
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a session token for storage
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Get agency user by email and agency ID (without password hash)
 */
export async function getAgencyUserByEmail(
  email: string,
  agencyId: string
): Promise<AgencyUser | null> {
  const client = createServiceSupabaseClient();

  const { data, error } = await client
    .from('agency_users')
    .select('id, agency_id, email, name, is_active, last_login_at, created_at, updated_at, created_by')
    .eq('email', email.toLowerCase())
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AgencyUser;
}

/**
 * Get agency user by agency ID (one user per agency)
 */
export async function getAgencyUserByAgencyId(
  agencyId: string
): Promise<AgencyUser | null> {
  const client = createServiceSupabaseClient();

  const { data, error } = await client
    .from('agency_users')
    .select('id, agency_id, email, name, is_active, last_login_at, created_at, updated_at, created_by')
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AgencyUser;
}

/**
 * Get agency user password hash for verification
 */
export async function getAgencyUserPasswordHash(
  userId: string
): Promise<string | null> {
  const client = createServiceSupabaseClient();

  const { data, error } = await client
    .from('agency_users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.password_hash;
}

/**
 * Get agency user with agency information
 */
export async function getAgencyUserWithAgency(
  email: string,
  agencyId: string
): Promise<AgencyUserWithAgency | null> {
  const client = createServiceSupabaseClient();

  const { data, error } = await client.rpc('get_agency_user_with_agency', {
    p_user_email: email.toLowerCase(),
    p_agency_id: agencyId,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  const result = Array.isArray(data) ? data[0] : data;
  return result as AgencyUserWithAgency;
}

/**
 * Create a new agency user (one per agency)
 */
export async function createAgencyUser(
  agencyId: string,
  email: string,
  password: string,
  name?: string,
  createdBy?: string
): Promise<{ success: boolean; user?: AgencyUser; error?: string }> {
  const client = createServiceSupabaseClient();

  // Check if user already exists for this agency (unique constraint)
  const existing = await getAgencyUserByAgencyId(agencyId);
  if (existing) {
    return { success: false, error: 'A user already exists for this agency' };
  }

  // Also check if email is already used
  const existingByEmail = await getAgencyUserByEmail(email, agencyId);
  if (existingByEmail) {
    return { success: false, error: 'User with this email already exists' };
  }

  const passwordHash = hashPassword(password);

  const { data, error } = await client
    .from('agency_users')
    .insert({
      agency_id: agencyId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name || null,
      is_active: true,
      created_by: createdBy || null,
    })
    .select('id, agency_id, email, name, is_active, last_login_at, created_at, updated_at, created_by')
    .single();

  if (error || !data) {
    console.error('[Agency Auth] Failed to create agency user', error);
    // Check if it's a unique constraint violation
    if (error?.code === '23505') {
      return { success: false, error: 'A user already exists for this agency' };
    }
    return {
      success: false,
      error: error?.message || 'Failed to create agency user',
    };
  }

  return { success: true, user: data as AgencyUser };
}

/**
 * Create a session for an agency user
 */
export async function createAgencySession(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  ttlHours: number = 24 * 7 // 7 days default
): Promise<{ success: boolean; token?: string; error?: string }> {
  const client = createServiceSupabaseClient();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const { error } = await client.from('agency_sessions').insert({
    agency_user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  if (error) {
    console.error('[Agency Auth] Failed to create session', error);
    return { success: false, error: 'Failed to create session' };
  }

  return { success: true, token };
}

/**
 * Validate a session token and get the user
 */
export async function validateAgencySession(
  token: string
): Promise<{ valid: boolean; user?: AgencyUserWithAgency; error?: string }> {
  const client = createServiceSupabaseClient();

  const tokenHash = hashSessionToken(token);

  // Get session
  const { data: sessionData, error: sessionError } = await client
    .from('agency_sessions')
    .select('id, expires_at, agency_user_id, last_used_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (sessionError || !sessionData) {
    return { valid: false, error: 'Invalid or expired session' };
  }

  const session = sessionData as any;

  // Get user with agency info
  const { data: userData, error: userError } = await client
    .from('agency_users')
    .select(
      `
      id,
      agency_id,
      email,
      name,
      is_active,
      last_login_at,
      created_at,
      updated_at,
      created_by,
      agencies (
        id,
        name,
        subdomain
      )
    `
    )
    .eq('id', session.agency_user_id)
    .eq('is_active', true)
    .single();

  if (userError || !userData) {
    return { valid: false, error: 'User not found or inactive' };
  }

  const user = userData as any;

  // Update last_used_at
  await client
    .from('agency_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', session.id);

  // Update user's last_login_at if this is first login today
  const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
  const now = new Date();
  if (!lastLogin || lastLogin.toDateString() !== now.toDateString()) {
    await client
      .from('agency_users')
      .update({ last_login_at: now.toISOString() })
      .eq('id', user.id);
  }

  const agency = Array.isArray(user.agencies) ? user.agencies[0] : user.agencies;

  const userWithAgency: AgencyUserWithAgency = {
    id: user.id,
    agency_id: user.agency_id,
    email: user.email,
    name: user.name,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    created_by: user.created_by,
    agency_name: agency.name,
    agency_subdomain: agency.subdomain,
  };

  return { valid: true, user: userWithAgency };
}

/**
 * Delete a session (logout)
 */
export async function deleteAgencySession(token: string): Promise<{ success: boolean; error?: string }> {
  const client = createServiceSupabaseClient();

  const tokenHash = hashSessionToken(token);

  const { error } = await client.from('agency_sessions').delete().eq('token_hash', tokenHash);

  if (error) {
    console.error('[Agency Auth] Failed to delete session', error);
    return { success: false, error: 'Failed to delete session' };
  }

  return { success: true };
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllAgencyUserSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  const client = createServiceSupabaseClient();

  const { error } = await client.from('agency_sessions').delete().eq('agency_user_id', userId);

  if (error) {
    console.error('[Agency Auth] Failed to delete sessions', error);
    return { success: false, error: 'Failed to delete sessions' };
  }

  return { success: true };
}

/**
 * Update agency user password
 */
export async function updateAgencyUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const client = createServiceSupabaseClient();

  const passwordHash = hashPassword(newPassword);

  const { error } = await client
    .from('agency_users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[Agency Auth] Failed to update password', error);
    return { success: false, error: 'Failed to update password' };
  }

  // Invalidate all existing sessions for security
  await deleteAllAgencyUserSessions(userId);

  return { success: true };
}

/**
 * Generate a secure password reset token
 */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a password reset token for storage
 */
export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a password reset token for an agency user
 */
export async function createPasswordResetToken(
  userId: string,
  ttlHours: number = 1, // 1 hour default
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const client = createServiceSupabaseClient();

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  // Invalidate any existing unused tokens for this user
  await client
    .from('agency_password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('agency_user_id', userId)
    .is('used_at', null);

  const { error } = await client.from('agency_password_reset_tokens').insert({
    agency_user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  if (error) {
    console.error('[Agency Auth] Failed to create password reset token', error);
    return { success: false, error: 'Failed to create password reset token' };
  }

  return { success: true, token };
}

/**
 * Validate a password reset token
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const client = createServiceSupabaseClient();

  const tokenHash = hashPasswordResetToken(token);

  const { data, error } = await client
    .from('agency_password_reset_tokens')
    .select('agency_user_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired reset token' };
  }

  const tokenData = data as any;

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, error: 'Reset token has expired' };
  }

  // Check if token is already used
  if (tokenData.used_at) {
    return { valid: false, error: 'Reset token has already been used' };
  }

  return { valid: true, userId: tokenData.agency_user_id };
}

/**
 * Mark a password reset token as used
 */
export async function markPasswordResetTokenAsUsed(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const client = createServiceSupabaseClient();

  const tokenHash = hashPasswordResetToken(token);

  const { error } = await client
    .from('agency_password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('used_at', null);

  if (error) {
    console.error('[Agency Auth] Failed to mark token as used', error);
    return { success: false, error: 'Failed to mark token as used' };
  }

  return { success: true };
}

/**
 * Get agency user by email (for password reset)
 */
export async function getAgencyUserByEmailForReset(
  email: string,
  agencyId: string
): Promise<AgencyUser | null> {
  const client = createServiceSupabaseClient();

  const { data, error } = await client
    .from('agency_users')
    .select('id, agency_id, email, name, is_active, last_login_at, created_at, updated_at, created_by')
    .eq('email', email.toLowerCase())
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AgencyUser;
}

