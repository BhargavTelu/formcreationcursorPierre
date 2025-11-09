import { NextRequest, NextResponse } from 'next/server';
import { validateAgencySession } from '@/lib/agency-auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('agency-session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await validateAgencySession(token);

    if (!session.valid || !session.user) {
      return NextResponse.json(
        { success: false, error: session.error || 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        agency_id: session.user.agency_id,
        agency_name: session.user.agency_name,
        agency_subdomain: session.user.agency_subdomain,
      },
    });
  } catch (error) {
    console.error('[Agency Auth] Me error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}

