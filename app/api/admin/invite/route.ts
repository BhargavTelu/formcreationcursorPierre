import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase';
import { isSuperAdmin, inviteAdmin } from '@/lib/admin';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/admin/invite
 * Invite a new admin user (requires super admin status)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden. Only super admins can invite other admins.' 
        },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Invite admin
    const result = await inviteAdmin(email, user.id);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to invite admin' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}. They will receive an email to set their password.`,
    });
  } catch (error: any) {
    console.error('[API] Error inviting admin:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/invite
 * Get list of all admins (requires super admin status)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Import getAllAdmins
    const { getAllAdmins } = await import('@/lib/admin');
    const admins = await getAllAdmins();

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error('[API] Error fetching admins:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

