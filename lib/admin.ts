import { getCurrentUser } from './supabase';
import { createServerSupabaseClient } from './supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Check if user is super admin (from database)
 * @param userId - Optional user ID to check. If not provided, checks current authenticated user
 */
export async function isSuperAdmin(userId?: string): Promise<boolean> {
  const user = userId ? null : await getCurrentUser();
  const userIdToCheck = userId || user?.id;

  if (!userIdToCheck) {
    return false;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userIdToCheck)
      .eq('status', 'active')
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('[Admin] Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if email is in admin_users table (for invitation check)
 * @param email - Email address to check
 */
export async function isEmailInAdminList(email: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get admin user by email
 * @param email - Email address
 */
export async function getAdminByEmail(email: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Admin] Error getting admin by email:', error);
    return null;
  }
}

/**
 * Create admin user and send invitation (requires service role key)
 * @param email - Email address of the new admin
 * @param invitedByUserId - User ID of the admin who is inviting
 */
export async function inviteAdmin(
  email: string,
  invitedByUserId: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return { success: false, error: 'Service role key not configured' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { success: false, error: 'Supabase URL not configured' };
    }

    // Create Supabase admin client (uses service role key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in auth.users
    let userId: string;
    let userExists = false;

    try {
      // List users and filter by email
      const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      const existingUser = usersList?.users?.find(user => 
        user.email?.toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        userId = existingUser.id;
        userExists = true;
      } else {
        // Create new user via Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true, // Auto-confirm email so they can reset password
          user_metadata: {
            invited_as_admin: true,
          },
        });

        if (createError || !newUser?.user) {
          return { 
            success: false, 
            error: createError?.message || 'Failed to create user' 
          };
        }

        userId = newUser.user.id;
      }
    } catch (error: any) {
      console.error('[Admin] Error creating/getting user:', error);
      return { success: false, error: error?.message || 'Failed to create user' };
    }

    // Check if email already exists in admin_users table
    const supabase = createServerSupabaseClient();
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existingAdmin) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          user_id: userId,
          status: 'pending',
          invited_by: invitedByUserId,
          invited_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase.from('admin_users').insert({
        email: normalizedEmail,
        user_id: userId,
        status: 'pending',
        invited_by: invitedByUserId,
        is_active: true,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // Send password reset email (acts as invitation)
    // If user exists, send reset email; if new user, they can set password via confirmation
    try {
      if (userExists) {
        // User exists, send password reset email
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: normalizedEmail,
        });

        if (resetError) {
          console.error('[Admin] Error sending password reset:', resetError);
          // Don't fail the invitation if email send fails
        }
      } else {
        // New user - Supabase will send confirmation email automatically
        // We can also send a custom invitation
        const { error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: normalizedEmail,
        });

        if (inviteError) {
          console.error('[Admin] Error sending invitation:', inviteError);
          // Don't fail the invitation if email send fails
        }
      }
    } catch (emailError) {
      console.error('[Admin] Error sending invitation email:', emailError);
      // Continue even if email fails - admin can resend
    }

    return { success: true, userId };
  } catch (error: any) {
    console.error('[Admin] Error inviting admin:', error);
    return { success: false, error: error?.message || 'Failed to invite admin' };
  }
}

/**
 * Get all admin users (only callable by admins)
 */
export async function getAllAdmins() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin] Error fetching admins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Admin] Error fetching admins:', error);
    return [];
  }
}

/**
 * Activate admin when they set their password (called via webhook or manually)
 * @param userId - User ID who just confirmed their email/set password
 */
export async function activateAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('admin_users')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending');

    return !error;
  } catch (error) {
    console.error('[Admin] Error activating admin:', error);
    return false;
  }
}

