import { NextResponse } from 'next/server';
import { getSessionWithProfile } from '@/lib/auth';

export async function GET() {
  try {
    const { user, profile } = await getSessionWithProfile();

    if (!user || !profile) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorised' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: profile.email ?? user.email,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error('[Auth] Failed to read session', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load session' },
      { status: 500 }
    );
  }
}



