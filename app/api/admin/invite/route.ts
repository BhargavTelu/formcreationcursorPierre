/**
 * Admin Invitation API Route
 * POST /api/admin/invite - Send invitation to new admin user
 * GET /api/admin/invite - Get all invitations (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createInvitation, getAllInvitations } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';
import { getUserProfile } from '@/lib/auth';

// Force dynamic rendering (API routes need auth/cookies)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/invite
 * Get all invitations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { userId } = await requireAdmin();

    // Get all invitations
    const invitations = await getAllInvitations();

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error: any) {
    console.error('[API] Error fetching invitations:', error);
    
    const status = error.message.includes('required') ? 401 : 403;
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch invitations',
      },
      { status }
    );
  }
}

/**
 * POST /api/admin/invite
 * Send invitation to new admin user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { userId, profile } = await requireAdmin();

    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Create invitation
    const { invitation, error: inviteError } = await createInvitation(
      email.toLowerCase().trim(),
      userId
    );

    if (inviteError) {
      return NextResponse.json(
        {
          success: false,
          error: inviteError,
        },
        { status: 400 }
      );
    }

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      email: invitation.email,
      invitedBy: profile.email,
      token: invitation.token,
    });

    // Return response (success even if email fails - user can manually share link)
    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
        },
        emailSent: emailResult.success,
        emailError: emailResult.error,
        // In development, include the token for easy testing
        ...(process.env.NODE_ENV === 'development' && {
          inviteUrl: `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/invite/accept?token=${invitation.token}`,
        }),
      },
      message: emailResult.success
        ? 'Invitation sent successfully'
        : `Invitation created but email failed: ${emailResult.error}`,
    });
  } catch (error: any) {
    console.error('[API] Error creating invitation:', error);
    
    const status = error.message.includes('required') ? 401 : 403;
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create invitation',
      },
      { status }
    );
  }
}

/**
 * DELETE /api/admin/invite/[id]
 * Revoke an invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    // Get invitation ID from URL
    const url = new URL(request.url);
    const invitationId = url.searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invitation ID is required',
        },
        { status: 400 }
      );
    }

    // Revoke invitation
    const { revokeInvitation } = await import('@/lib/auth');
    const success = await revokeInvitation(invitationId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to revoke invitation',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error: any) {
    console.error('[API] Error revoking invitation:', error);
    
    const status = error.message.includes('required') ? 401 : 403;
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to revoke invitation',
      },
      { status }
    );
  }
}

