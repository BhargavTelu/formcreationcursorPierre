import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServiceSupabaseClient, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { hashInvitationToken } from '@/lib/invitations';

const acceptSchema = z.object({
  token: z.string().min(32, 'Invalid token provided'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { token, password } = acceptSchema.parse(json);
    const tokenHash = hashInvitationToken(token);

    const serviceClient = createServiceSupabaseClient();

    const { data: invitationRows, error: invitationError } = await serviceClient
      .from('invitations')
      .select('id, email, status, expires_at, invited_by')
      .eq('token_hash', tokenHash)
      .limit(1);

    if (invitationError) {
      console.error('[Invite] Failed to fetch invitation', invitationError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate invitation token.' },
        { status: 500 }
      );
    }

    const invitation = Array.isArray(invitationRows) && invitationRows.length > 0 ? invitationRows[0] : null;

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found.' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been used or revoked.' },
        { status: 409 }
      );
    }

    if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired.' },
        { status: 410 }
      );
    }

    const { data: existingProfiles, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('email', invitation.email)
      .limit(1);

    if (profileError) {
      console.error('[Invite] Failed to read profile', profileError);
      return NextResponse.json(
        { success: false, error: 'Unable to prepare account.' },
        { status: 500 }
      );
    }

    const existingProfile = Array.isArray(existingProfiles) && existingProfiles.length > 0 ? existingProfiles[0] : null;

    let createdUserId: string | null = null;

    if (existingProfile) {
      if (existingProfile.role === 'admin') {
        return NextResponse.json(
          { success: false, error: 'This invitation has already been accepted.' },
          { status: 409 }
        );
      }

      const { error: updateError } = await serviceClient.auth.admin.updateUserById(existingProfile.id, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error('[Invite] Failed to update existing user', updateError);
        return NextResponse.json(
          { success: false, error: 'Unable to activate account.' },
          { status: 500 }
        );
      }

      createdUserId = existingProfile.id;

      await serviceClient
        .from('profiles')
        .update({ role: 'admin', activated_at: new Date().toISOString() })
        .eq('id', existingProfile.id);
    } else {
      const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
      });

      if (createError || !createdUser) {
        console.error('[Invite] Failed to create user', createError);
        return NextResponse.json(
          { success: false, error: 'Unable to create administrator account.' },
          { status: 500 }
        );
      }

      createdUserId = createdUser.user?.id ?? null;
    }

    if (createdUserId) {
      await serviceClient
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: createdUserId,
        })
        .eq('id', invitation.id);
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error('[Invite] Auto sign-in failed', signInError);
      return NextResponse.json(
        {
          success: true,
          warning: 'Account activated, please sign in manually.',
        },
        { status: 200 }
      );
    }

    const response = NextResponse.json({
      success: true,
      redirect: '/admin/dashboard',
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const accessTtl = signInData.session.expires_in || 3600;
    const refreshTtl = 60 * 60 * 24 * 7;

    response.cookies.set('sb-access-token', signInData.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTtl,
    });

    response.cookies.set('sb-refresh-token', signInData.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTtl,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    console.error('[Invite] Unexpected accept error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to accept invitation.' },
      { status: 500 }
    );
  }
}



