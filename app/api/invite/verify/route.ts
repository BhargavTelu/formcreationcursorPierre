/**
 * Invitation Verification API Route
 * GET /api/invite/verify?token=xxx - Verify invitation token (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/auth';

// Force dynamic rendering (required for query params)
export const dynamic = 'force-dynamic';

/**
 * GET /api/invite/verify?token=xxx
 * Verify invitation token without authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Token is required',
        },
        { status: 400 }
      );
    }

    // Validate token
    const result = await validateInvitationToken(token);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error || 'Invalid invitation',
      });
    }

    // Return invitation details (without sensitive info)
    return NextResponse.json({
      valid: true,
      invitation: {
        email: result.invitation?.email,
        expires_at: result.invitation?.expires_at,
      },
    });
  } catch (error: any) {
    console.error('[API] Error verifying invitation:', error);
    
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to verify invitation',
      },
      { status: 500 }
    );
  }
}

