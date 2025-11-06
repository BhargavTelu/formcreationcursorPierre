/**
 * Authentication & Authorization Utilities
 * Production-grade RBAC helpers for admin invitation system
 */

import { createAuthenticatedSupabaseClient, getCurrentUser } from './supabase';

export type UserRole = 'admin' | 'pending_invite';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string | null;
  invited_at: string | null;
  activated_at: string | null;
  last_sign_in_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_by: string | null;  // Nullable for system invitations
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile with role information
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[Auth] Error fetching user profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const profile = await getUserProfile(user.id);
  return profile?.role === 'admin';
}

/**
 * Check if a specific user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role === 'admin';
}

/**
 * Require admin role - throws error if not admin
 * Use this in API routes to protect admin-only endpoints
 */
export async function requireAdmin(): Promise<{ userId: string; profile: Profile }> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const profile = await getUserProfile(user.id);
  
  if (!profile) {
    throw new Error('User profile not found');
  }

  if (profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return { userId: user.id, profile };
}

/**
 * Generate secure invitation token (URL-safe base64)
 */
export function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Use base64url encoding (URL-safe: no +, /, or =)
  return Buffer.from(array).toString('base64url');
}

/**
 * Create an invitation for a new admin user
 */
export async function createInvitation(
  email: string,
  invitedBy: string
): Promise<{ invitation: Invitation; error?: string }> {
  const supabase = await createAuthenticatedSupabaseClient();

  // Check if email already has a user account
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('email', email.toLowerCase())
    .single();

  if (existingProfile) {
    return {
      invitation: {} as Invitation,
      error: 'User with this email already exists',
    };
  }

  // Check if there's already a pending invitation
  const { data: existingInvitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (existingInvitation) {
    return {
      invitation: existingInvitation as Invitation,
      error: 'Active invitation already exists for this email',
    };
  }

  // Generate secure token
  const token = generateInvitationToken();
  
  // Create invitation
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      email: email.toLowerCase(),
      token,
      invited_by: invitedBy,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[Auth] Error creating invitation:', error);
    return {
      invitation: {} as Invitation,
      error: error?.message || 'Failed to create invitation',
    };
  }

  return { invitation: data as Invitation };
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    console.error('[Auth] Error fetching invitation:', error);
    return null;
  }

  return data as Invitation;
}

/**
 * Validate invitation token (without auth)
 */
export async function validateInvitationToken(token: string): Promise<{
  valid: boolean;
  invitation?: Invitation;
  error?: string;
}> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid invitation token' };
  }

  const invitation = data as Invitation;

  // Check if already accepted
  if (invitation.status === 'accepted') {
    return { valid: false, error: 'Invitation already used' };
  }

  // Check if expired
  if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'Invitation expired' };
  }

  // Check if revoked
  if (invitation.status === 'revoked') {
    return { valid: false, error: 'Invitation revoked' };
  }

  return { valid: true, invitation };
}

/**
 * Mark invitation as accepted
 */
export async function markInvitationAccepted(
  invitationId: string,
  acceptedBy: string
): Promise<boolean> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { error } = await supabase
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: acceptedBy,
    })
    .eq('id', invitationId);

  if (error) {
    console.error('[Auth] Error marking invitation as accepted:', error);
    return false;
  }

  return true;
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(invitationId: string): Promise<boolean> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    console.error('[Auth] Error revoking invitation:', error);
    return false;
  }

  return true;
}

/**
 * Get all invitations (admin only)
 */
export async function getAllInvitations(): Promise<Invitation[]> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Auth] Error fetching invitations:', error);
    return [];
  }

  return data as Invitation[];
}

/**
 * Get all admin profiles
 */
export async function getAllAdmins(): Promise<Profile[]> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('[Auth] Error fetching admins:', error);
    return [];
  }

  return data as Profile[];
}

/**
 * Update user's last sign-in timestamp
 */
export async function updateLastSignIn(userId: string): Promise<void> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  await supabase
    .from('profiles')
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Clean up expired invitations
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const supabase = await createAuthenticatedSupabaseClient();
  
  const { data, error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) {
    console.error('[Auth] Error cleaning up expired invitations:', error);
    return 0;
  }

  return data?.length || 0;
}

