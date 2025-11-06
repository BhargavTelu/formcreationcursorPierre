/**
 * Invitation Acceptance API Route
 * POST /api/invite/accept - Accept invitation and create admin account
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

// Force dynamic rendering (API route with POST body)
export const dynamic = 'force-dynamic';

/**
 * POST /api/invite/accept
 * Accept invitation and create admin account
 * 
 * Body: { token: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token and password are required',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters long',
        },
        { status: 400 }
      );
    }

    // Validate invitation token
    const validation = await validateInvitationToken(token);

    if (!validation.valid || !validation.invitation) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid invitation',
        },
        { status: 400 }
      );
    }

    const invitation = validation.invitation;

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', invitation.email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'User already exists with this email',
        },
        { status: 400 }
      );
    }

    // Create user account via Supabase Auth
    console.log('[API] Creating user account for:', invitation.email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/admin/dashboard`,
        data: {
          invitation_token: token,
        },
      },
    });

    if (authError || !authData.user) {
      console.error('[API] Error creating user:', authError);
      return NextResponse.json(
        {
          success: false,
          error: authError?.message || 'Failed to create account',
          details: authError?.status || 'unknown',
        },
        { status: 500 }
      );
    }

    console.log('[API] User created successfully:', authData.user.id);
    console.log('[API] Waiting for database trigger to create profile...');

    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify profile was created correctly
    console.log('[API] Checking if profile was created...');
    
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single();

    console.log('[API] Profile query result:', { profile, error: profileError });

    // FALLBACK: If trigger failed, manually create profile
    if (profileError || !profile) {
      console.warn('[API] Trigger may have failed. Attempting manual profile creation...');
      
      // Use service role to bypass RLS
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.error('[API] Service role key not configured');
        return NextResponse.json(
          {
            success: false,
            error: 'Database error: Service role key not configured',
            details: 'Cannot create profile manually. Trigger may have failed.',
            userId: authData.user.id,
          },
          { status: 500 }
        );
      }

      // Create Supabase client with service role (bypasses RLS)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Manually create profile with admin role
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: invitation.email,
          role: 'admin',
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at,
          activated_at: new Date().toISOString(),
        })
        .select('id, email, role')
        .single();

      if (createError) {
        console.error('[API] Error manually creating profile:', createError);
        
        // Try update instead (in case profile exists but wasn't found due to RLS)
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: 'admin',
            activated_at: new Date().toISOString(),
            invited_by: invitation.invited_by,
            invited_at: invitation.created_at,
          })
          .eq('id', authData.user.id)
          .select('id, email, role')
          .single();

        if (updateError || !updatedProfile) {
          return NextResponse.json(
            {
              success: false,
              error: 'Database error: Failed to create or update profile',
              details: createError?.message || updateError?.message || 'Unknown error',
              userId: authData.user.id,
            },
            { status: 500 }
          );
        }

        profile = updatedProfile;
        console.log('[API] Profile updated manually:', profile);
      } else {
        profile = newProfile;
        console.log('[API] Profile created manually:', profile);
      }

      // Mark invitation as accepted
      await supabaseAdmin
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: authData.user.id,
        })
        .eq('id', invitation.id);
    }

    // Final verification
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found after creation attempt',
          userId: authData.user.id,
        },
        { status: 500 }
      );
    }

    if (profile.role !== 'admin') {
      console.error('[API] Profile has wrong role:', profile.role);
      return NextResponse.json(
        {
          success: false,
          error: `Account created but role is '${profile.role}' instead of 'admin'. Check invitation status.`,
          userId: authData.user.id,
          role: profile.role,
        },
        { status: 500 }
      );
    }

    console.log('[API] Profile verified successfully. Role:', profile.role);

    // Return success with session data
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: profile.role,
        },
        session: authData.session,
      },
    });
  } catch (error: any) {
    console.error('[API] Error accepting invitation:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to accept invitation',
      },
      { status: 500 }
    );
  }
}

