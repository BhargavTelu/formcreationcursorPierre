/**
 * Email Service for Invitation System
 * Sends invitation emails to new admin users
 */

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'finestafrica.ai';
const APP_NAME = 'Finest Africa Travel Planning';

export interface InvitationEmailData {
  email: string;
  invitedBy: string;
  token: string;
}

/**
 * Generate invitation email HTML
 */
function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const inviteUrl = `https://${APP_DOMAIN}/invite/accept?token=${data.token}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0ea5e9 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">You've Been Invited! 🎉</h2>
              
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                You have been invited to join <strong>${APP_NAME}</strong> as an administrator.
              </p>
              
              <p style="margin: 0 0 32px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                As an admin, you'll have full access to manage agencies, view form submissions, and invite other administrators.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accept Invitation & Set Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 32px; padding: 12px; background-color: #f3f4f6; border-radius: 4px; color: #374151; font-size: 12px; word-break: break-all;">
                ${inviteUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
              
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                <strong>⚠️ Security Notice:</strong>
              </p>
              
              <ul style="margin: 0 0 16px; padding-left: 20px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                <li>This invitation link is valid for <strong>7 days</strong></li>
                <li>It can only be used <strong>once</strong></li>
                <li>Never share this link with anyone</li>
                <li>If you didn't expect this invitation, please ignore this email</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                This invitation was sent by <strong>${data.invitedBy}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of invitation email
 */
function generateInvitationEmailText(data: InvitationEmailData): string {
  const inviteUrl = `https://${APP_DOMAIN}/invite/accept?token=${data.token}`;
  
  return `
${APP_NAME} - Admin Invitation

You've Been Invited!

You have been invited to join ${APP_NAME} as an administrator.

As an admin, you'll have full access to manage agencies, view form submissions, and invite other administrators.

Accept your invitation by clicking the link below:
${inviteUrl}

SECURITY NOTICE:
- This invitation link is valid for 7 days
- It can only be used once
- Never share this link with anyone
- If you didn't expect this invitation, please ignore this email

This invitation was sent by ${data.invitedBy}

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
  `.trim();
}

/**
 * Send invitation email using Supabase Edge Function or external service
 * 
 * IMPLEMENTATION OPTIONS:
 * 
 * 1. Supabase Edge Function (Recommended for production)
 *    - Create edge function: supabase functions new send-email
 *    - Use Resend, SendGrid, or AWS SES
 * 
 * 2. Next.js API Route with email service
 *    - Use this file with your preferred email provider
 * 
 * 3. For development: Log to console
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  const htmlContent = generateInvitationEmailHtml(data);
  const textContent = generateInvitationEmailText(data);
  
  // === DEVELOPMENT MODE: Log to console ===
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 INVITATION EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${data.email}`);
    console.log(`From: noreply@${APP_DOMAIN}`);
    console.log(`Subject: You've been invited to ${APP_NAME}`);
    console.log('-'.repeat(80));
    console.log(textContent);
    console.log('='.repeat(80) + '\n');
    
    return { success: true };
  }
  
  // === PRODUCTION MODE: Send via email service ===
  
  try {
    // OPTION 1: Use Resend (recommended)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${APP_NAME} <noreply@${APP_DOMAIN}>`,
          to: [data.email],
          subject: `You've been invited to ${APP_NAME}`,
          html: htmlContent,
          text: textContent,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Resend error:', error);
        return { success: false, error: 'Failed to send email' };
      }
      
      return { success: true };
    }
    
    // OPTION 2: Use SendGrid
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: data.email }],
          }],
          from: {
            email: `noreply@${APP_DOMAIN}`,
            name: APP_NAME,
          },
          subject: `You've been invited to ${APP_NAME}`,
          content: [
            { type: 'text/plain', value: textContent },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] SendGrid error:', error);
        return { success: false, error: 'Failed to send email' };
      }
      
      return { success: true };
    }
    
    // OPTION 3: Use Supabase Edge Function
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Supabase edge function error:', error);
        return { success: false, error: 'Failed to send email' };
      }
      
      return { success: true };
    }
    
    // No email service configured - fallback to console
    console.warn('[Email] No email service configured. Email not sent.');
    console.log('\n' + '='.repeat(80));
    console.log('📧 INVITATION EMAIL (No service configured)');
    console.log('='.repeat(80));
    console.log(`To: ${data.email}`);
    console.log(`Invitation URL: https://${APP_DOMAIN}/invite/accept?token=${data.token}`);
    console.log('='.repeat(80) + '\n');
    
    return { 
      success: false, 
      error: 'Email service not configured. Check console for invitation link.' 
    };
    
  } catch (error: any) {
    console.error('[Email] Error sending invitation email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Get preview of invitation email (for testing)
 */
export function getInvitationEmailPreview(data: InvitationEmailData): {
  html: string;
  text: string;
} {
  return {
    html: generateInvitationEmailHtml(data),
    text: generateInvitationEmailText(data),
  };
}

