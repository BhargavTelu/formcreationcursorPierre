import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { hashInvitationToken, maskEmail } from '@/lib/invitations';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Invitation token is required.' },
      { status: 400 }
    );
  }

  const client = createServiceSupabaseClient();
  const tokenHash = hashInvitationToken(token);

  const { data, error } = await client
    .from('invitations')
    .select('email, status, expires_at')
    .eq('token_hash', tokenHash)
    .limit(1);

  if (error) {
    console.error('[Invite] Failed to validate token', error);
    return NextResponse.json(
      { success: false, error: 'Unable to validate invitation' },
      { status: 500 }
    );
  }

  const invitation = Array.isArray(data) && data.length > 0 ? data[0] : null;

  if (!invitation) {
    return NextResponse.json(
      { success: false, error: 'Invitation not found.' },
      { status: 404 }
    );
  }

  const isExpired = invitation.expires_at ? new Date(invitation.expires_at).getTime() < Date.now() : true;

  if (invitation.status !== 'pending' || isExpired) {
    return NextResponse.json(
      { success: false, error: 'Invitation is no longer valid.' },
      { status: 410 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      email: maskEmail(invitation.email),
      expiresAt: invitation.expires_at,
    },
  });
}

