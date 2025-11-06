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
        },
        { status: 500 }
      );
    }

    // Note: The profile is automatically created with admin role via database trigger
    // The trigger checks for valid invitation and sets role to 'admin'

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile was created correctly
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      console.error('[API] Profile not created correctly:', profile);
      return NextResponse.json(
        {
          success: false,
          error: 'Account created but admin role not assigned. Please contact support.',
        },
        { status: 500 }
      );
    }

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

