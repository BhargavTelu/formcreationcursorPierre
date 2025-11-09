import { NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient } from '@/lib/supabase';

export async function POST() {
  try {
    const client = await createAuthenticatedSupabaseClient();
    await client.auth.signOut();

    const response = NextResponse.json({ success: true });
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('sb-access-token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error('[Auth] Sign-out failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out.' },
      { status: 500 }
    );
  }
}



