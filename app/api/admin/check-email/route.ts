import { NextRequest, NextResponse } from 'next/server';
import { isEmailInAdminList } from '@/lib/admin';

/**
 * POST /api/admin/check-email
 * Check if an email is in the admin_users table
 * Used for password reset verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is in admin_users table
    const isAdmin = await isEmailInAdminList(email);

    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This email is not authorized to access the admin panel.' 
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email is authorized',
    });
  } catch (error: any) {
    console.error('[API] Error checking email:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

