import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validatePasswordResetToken,
  markPasswordResetTokenAsUsed,
  updateAgencyUserPassword,
} from '@/lib/agency-auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { token, password } = resetPasswordSchema.parse(json);

    // Validate the reset token
    const validationResult = await validatePasswordResetToken(token);
    
    if (!validationResult.valid || !validationResult.userId) {
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update the password
    const updateResult = await updateAgencyUserPassword(validationResult.userId, password);
    
    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error || 'Failed to update password' },
        { status: 500 }
      );
    }

    // Mark the token as used
    await markPasswordResetTokenAsUsed(token);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    console.error('[Agency Auth] Reset password error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}


