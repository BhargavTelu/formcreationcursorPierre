interface AdminInviteEmailOptions {
  email: string;
  token: string;
  invitedBy: string;
}

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress = process.env.INVITE_EMAIL_FROM || 'Finest Africa <admin@finestafrica.ai>';

function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // In production, use the production URL
  return 'https://www.finestafrica.ai';
}

export async function sendAdminInviteEmail({ email, token, invitedBy }: AdminInviteEmailOptions) {
  const inviteUrl = `${getAppBaseUrl()}/invite/accept?token=${encodeURIComponent(token)}`;

  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY is not configured. Invitation URL:', inviteUrl);
    return { delivered: false, inviteUrl };
  }

  const subject = 'Finest Africa Admin Panel Invitation';
  const html = `
    <table style="width:100%; max-width:600px; margin:0 auto; font-family:Arial, sans-serif; color:#1f2937;">
      <tr>
        <td style="padding:24px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
          <h2 style="margin:0 0 20px; font-size:22px; color:#111827;">You've been invited to Finest Africa Admin Panel</h2>
          <p style="margin:0 0 16px;">Set your password and get admin access:</p>
          <p style="margin:0 0 20px;">
            <a href="${inviteUrl}" style="display:inline-block; padding:12px 20px; background-color:#059669; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">
              Accept Invitation
            </a>
          </p>
          <p style="margin:0 0 16px; word-break:break-all;">Or copy: ${inviteUrl}</p>
          <p style="margin:0 0 8px;"><strong>Expires in 48 hours.</strong></p>
          <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">
            This invitation was sent by ${invitedBy}. If you were not expecting it, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: defaultFromAddress,
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Email] Failed to send invitation email', response.status, errorText);
    throw new Error('Failed to dispatch invitation email');
  }

  return { delivered: true, inviteUrl };
}

interface AgencyPasswordResetEmailOptions {
  email: string;
  token: string;
  agencyName: string;
  agencySubdomain: string;
}

export async function sendAgencyPasswordResetEmail({
  email,
  token,
  agencyName,
  agencySubdomain,
}: AgencyPasswordResetEmailOptions) {
  const resetUrl = `${getAppBaseUrl()}/agency/${agencySubdomain}/reset-password?token=${encodeURIComponent(token)}`;

  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY is not configured. Password reset URL:', resetUrl);
    return { delivered: false, resetUrl };
  }

  const subject = `Reset Your Password - ${agencyName}`;
  const html = `
    <table style="width:100%; max-width:600px; margin:0 auto; font-family:Arial, sans-serif; color:#1f2937;">
      <tr>
        <td style="padding:24px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
          <h2 style="margin:0 0 20px; font-size:22px; color:#111827;">Reset Your Password</h2>
          <p style="margin:0 0 16px;">You requested to reset your password for ${agencyName}.</p>
          <p style="margin:0 0 16px;">Click the button below to set a new password:</p>
          <p style="margin:0 0 20px;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 20px; background-color:#059669; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="margin:0 0 16px; word-break:break-all; font-size:12px; color:#6b7280;">Or copy this link: ${resetUrl}</p>
          <p style="margin:0 0 8px;"><strong>This link expires in 1 hour.</strong></p>
          <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </td>
      </tr>
    </table>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: defaultFromAddress,
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Email] Failed to send password reset email', response.status, errorText);
    throw new Error('Failed to dispatch password reset email');
  }

  return { delivered: true, resetUrl };
}

