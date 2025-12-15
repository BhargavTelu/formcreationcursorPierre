import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { agencyLoginSchema } from '@/lib/types';
import { getAgencyBySubdomain } from '@/lib/agency';
import {
  getAgencyUserByEmail,
  getAgencyUserPasswordHash,
  verifyPassword,
  isLegacySha256PasswordHash,
  createAgencySession,
} from '@/lib/agency-auth';
import { createServiceSupabaseClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email, password, agency_subdomain } = agencyLoginSchema.parse(json);

    // Get agency by subdomain
    const agency = await getAgencyBySubdomain(agency_subdomain);
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Get agency user
    const user = await getAgencyUserByEmail(email, agency.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = await getAgencyUserPasswordHash(user.id);

    if (!passwordHash || !verifyPassword(password, passwordHash)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Upgrade legacy SHA-256 password hashes to bcrypt on successful login.
    // This keeps backward compatibility without a hard migration.
    if (isLegacySha256PasswordHash(passwordHash)) {
      try {
        const client = createServiceSupabaseClient();
        const newHash = bcrypt.hashSync(password, 12);
        await client
          .from('agency_users')
          .update({ password_hash: newHash, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (upgradeError) {
        // Non-fatal; login should still succeed.
        console.warn('[Agency Auth] Failed to upgrade legacy password hash', upgradeError);
      }
    }

    // Create session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const sessionResult = await createAgencySession(user.id, ipAddress, userAgent);
    if (!sessionResult.success || !sessionResult.token) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        agency_id: agency.id,
        agency_name: agency.name,
        agency_subdomain: agency.subdomain,
      },
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const sessionTtl = 60 * 60 * 24 * 7; // 7 days

    response.cookies.set('agency-session-token', sessionResult.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTtl,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    console.error('[Agency Auth] Login error', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

