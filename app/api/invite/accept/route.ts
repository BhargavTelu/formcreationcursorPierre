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
      .select('id, email, status, expires_at, invited_by, invited_at')
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
      console.error('[Invite] Failed to read profile', {
        error: profileError,
        message: profileError?.message,
        code: profileError?.code,
        email: invitation.email
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to prepare account.',
          details: profileError?.message || 'Profile query failed'
        },
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
      // Try to create a new user
      const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
      });

      // If user creation fails because email already exists in auth.users
      if (createError && (createError.code === 'email_exists' || createError.status === 422)) {
        console.log('[Invite] Email exists in auth.users but not in profiles, attempting to recover...', {
          email: invitation.email,
          error: createError.message
        });

        // Query auth.users directly via REST API to find the existing user by email
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_SERVICE_KEY) {
          console.error('[Invite] Missing service role key for user lookup');
          return NextResponse.json(
            { 
              success: false, 
              error: 'Server configuration error.',
              details: 'Unable to recover account'
            },
            { status: 500 }
          );
        }

        try {
          const getUserResponse = await fetch(
            `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(invitation.email)}`,
            {
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'apikey': SUPABASE_SERVICE_KEY,
              },
            }
          );

          if (!getUserResponse.ok) {
            const errorData = await getUserResponse.json().catch(() => ({}));
            console.error('[Invite] Failed to query user by email', {
              status: getUserResponse.status,
              error: errorData
            });
            return NextResponse.json(
              { 
                success: false, 
                error: 'Unable to recover existing account.',
                details: 'Email exists but could not retrieve user information'
              },
              { status: 500 }
            );
          }

          const usersData = await getUserResponse.json();
          const existingAuthUser = usersData.users?.[0];

          if (!existingAuthUser) {
            console.error('[Invite] Email exists error but user not found in auth.users', {
              email: invitation.email
            });
            return NextResponse.json(
              { 
                success: false, 
                error: 'Account recovery failed.',
                details: 'Email exists but user record not found'
              },
              { status: 500 }
            );
          }

        // Update the existing auth user's password
        const { error: updateError } = await serviceClient.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          email_confirm: true,
        });

        if (updateError) {
          console.error('[Invite] Failed to update existing auth user', updateError);
          return NextResponse.json(
            { success: false, error: 'Unable to activate account.' },
            { status: 500 }
          );
        }

        createdUserId = existingAuthUser.id;

        // Create the profile record for this existing auth user
        const { error: profileInsertError } = await serviceClient
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            email: invitation.email,
            role: 'admin',
            invited_by: invitation.invited_by,
            invited_at: invitation.invited_at || new Date().toISOString(),
            activated_at: new Date().toISOString(),
          });

        if (profileInsertError) {
          // If insert fails due to conflict, try update instead
          if (profileInsertError.code === '23505') { // Unique violation
            console.log('[Invite] Profile already exists, updating instead...');
            const { error: profileUpdateError } = await serviceClient
              .from('profiles')
              .update({
                role: 'admin',
                invited_by: invitation.invited_by,
                invited_at: invitation.invited_at || new Date().toISOString(),
                activated_at: new Date().toISOString(),
              })
              .eq('id', existingAuthUser.id);

            if (profileUpdateError) {
              console.error('[Invite] Failed to update profile', profileUpdateError);
              return NextResponse.json(
                { success: false, error: 'Unable to create profile record.' },
                { status: 500 }
              );
            }
          } else {
            console.error('[Invite] Failed to create profile', profileInsertError);
            return NextResponse.json(
              { success: false, error: 'Unable to create profile record.' },
              { status: 500 }
            );
          }
        }

        console.log('[Invite] Successfully recovered account and created profile', {
          userId: createdUserId,
          email: invitation.email
        });
        } catch (recoveryError: any) {
          console.error('[Invite] Error during account recovery', recoveryError);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Account recovery failed.',
              details: recoveryError?.message || 'Unexpected error during recovery'
            },
            { status: 500 }
          );
        }
      } else if (createError || !createdUser) {
        console.error('[Invite] Failed to create user', {
          error: createError,
          message: createError?.message,
          status: createError?.status,
          code: createError?.code,
          email: invitation.email
        });
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unable to create administrator account.',
            details: createError?.message || 'User creation failed'
          },
          { status: 500 }
        );
      } else {
        // User was successfully created
        createdUserId = createdUser.user?.id ?? null;
        
        if (!createdUserId) {
          console.error('[Invite] User created but no ID returned', { createdUser });
          return NextResponse.json(
            { success: false, error: 'User created but invalid response from auth system.' },
            { status: 500 }
          );
        }
      }
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



