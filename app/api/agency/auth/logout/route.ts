import { NextRequest, NextResponse } from 'next/server';
import { deleteAgencySession } from '@/lib/agency-auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('agency-session-token')?.value;

    if (token) {
      await deleteAgencySession(token);
    }

    const response = NextResponse.json({ success: true });
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('agency-session-token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('[Agency Auth] Logout error', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

