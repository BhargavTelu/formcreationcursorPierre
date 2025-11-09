import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import type { ProfileRole } from '@/lib/types';

const loginSchema = z.object({
  email: z
    .string()
    .email('A valid email is required')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email, password } = loginSchema.parse(json);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      console.error('[Auth] Sign-in failed', error);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const { data: profileRows, error: profileError } = await authedClient
      .from('profiles')
      .select('email, role')
      .eq('id', data.user.id)
      .limit(1);

    if (profileError) {
      console.error('[Auth] Failed to load profile during sign-in', profileError);
      return NextResponse.json(
        { success: false, error: 'Unable to validate account access.' },
        { status: 500 }
      );
    }

    const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null;

    if (!profile || profile.role !== 'admin') {
      await authedClient.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: 'Your account is not authorised for admin access.',
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        email: profile.email ?? data.user.email,
        role: profile.role as ProfileRole,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenTtl = data.session.expires_in || 3600;
    const refreshTokenTtl = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenTtl,
    });

    response.cookies.set('sb-refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTokenTtl,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Invalid payload',
        },
        { status: 400 }
      );
    }

    console.error('[Auth] Unexpected error during sign-in', error);

    return NextResponse.json(
      { success: false, error: 'Unable to sign in right now.' },
      { status: 500 }
    );
  }
}



