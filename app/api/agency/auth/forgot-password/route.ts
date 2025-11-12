import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgencyBySubdomain } from '@/lib/agency';
import {
  getAgencyUserByEmailForReset,
  createPasswordResetToken,
} from '@/lib/agency-auth';
import { sendAgencyPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email address').transform((val) => val.toLowerCase()),
  agency_subdomain: z.string().min(1, 'Agency subdomain is required'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email, agency_subdomain } = forgotPasswordSchema.parse(json);

    // Get agency by subdomain
    const agency = await getAgencyBySubdomain(agency_subdomain);
    if (!agency) {
      // Don't reveal that agency doesn't exist for security
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Get agency user
    const user = await getAgencyUserByEmailForReset(email, agency.id);
    
    // Always return success to prevent email enumeration
    // Only send email if user exists
    if (user) {
      // Get IP address and user agent
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;

      // Create password reset token
      const tokenResult = await createPasswordResetToken(user.id, 1, ipAddress, userAgent);
      
      if (tokenResult.success && tokenResult.token) {
        try {
          // Send password reset email
          await sendAgencyPasswordResetEmail({
            email: user.email,
            token: tokenResult.token,
            agencyName: agency.name,
            agencySubdomain: agency.subdomain,
          });
        } catch (emailError) {
          console.error('[Agency Auth] Failed to send password reset email', emailError);
          // Still return success to prevent information leakage
        }
      }
    }

    // Always return the same success message regardless of whether user exists
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    console.error('[Agency Auth] Forgot password error', error);
    // Return success even on error to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }
}


