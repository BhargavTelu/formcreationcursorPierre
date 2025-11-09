import crypto from 'crypto';

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getInvitationExpiry(hours = 48): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0] ?? ''}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}



