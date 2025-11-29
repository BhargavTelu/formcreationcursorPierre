import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { generateInvitationToken, hashInvitationToken, getInvitationExpiry } from '@/lib/invitations';
import { sendAdminInviteEmail } from '@/lib/email';

const inviteSchema = z.object({
  email: z
    .string()
    .email('A valid email is required')
    .transform((value) => value.toLowerCase()),
});

export async function GET() {
  try {
    await requireAdmin();
    const client = createServiceSupabaseClient();

    const { data, error } = await client
      .from('invitations')
      .select('id, email, status, invited_by, expires_at, accepted_at, last_sent_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Invitations] Failed to load invitations', error);
      return NextResponse.json(
        { success: false, error: 'Unable to load invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    if ((error as any)?.status) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: (error as any).status }
      );
    }

    console.error('[Invitations] Unexpected GET error', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error loading invitations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireAdmin();
    const json = await request.json();
    const { email } = inviteSchema.parse(json);

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const expiresAt = getInvitationExpiry(48);

    const client = createServiceSupabaseClient();

    const { data, error } = await client
      .from('invitations')
      .upsert(
        {
          email,
          token_hash: tokenHash,
          status: 'pending',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          accepted_at: null,
          accepted_by: null,
          last_sent_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('id, email, status, expires_at, last_sent_at')
      .single();

    if (error || !data) {
      console.error('[Invitations] Failed to upsert invitation', error);
      return NextResponse.json(
        { success: false, error: 'Unable to create invitation' },
        { status: 500 }
      );
    }

    const inviterEmail = profile?.email ?? user.email ?? 'admin@finestafrica.ai';
    const result = await sendAdminInviteEmail({
      email,
      token,
      invitedBy: inviterEmail,
    });

    // If email was not delivered, throw an error instead of returning the URL
    if (!result.delivered) {
      console.error('[Invitations] Email delivery failed - RESEND_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Email service is not configured. Please contact your system administrator.' },
        { status: 500 }
      );
    }

    // Only return success if email was delivered - never return the invite URL to the frontend
    return NextResponse.json({
      success: true,
      data,
      delivered: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    if ((error as any)?.status) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: (error as any).status }
      );
    }

    console.error('[Invitations] Unexpected POST error', error);
    return NextResponse.json(
      { success: false, error: 'Unable to send invitation' },
      { status: 500 }
    );
  }
}
