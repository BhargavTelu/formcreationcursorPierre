import { NextRequest } from 'next/server';
import { validateAgencySession } from './agency-auth';
import type { AgencyUserWithAgency } from './types';

export class AgencyUnauthorizedError extends Error {
  status = 401;

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AgencyUnauthorizedError';
  }
}

export class AgencyForbiddenError extends Error {
  status = 403;

  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AgencyForbiddenError';
  }
}

/**
 * Get authenticated agency user from request
 */
export async function getAgencyUserFromRequest(
  request: NextRequest
): Promise<{ user: AgencyUserWithAgency; token: string } | null> {
  const token = request.cookies.get('agency-session-token')?.value;

  if (!token) {
    return null;
  }

  const session = await validateAgencySession(token);

  if (!session.valid || !session.user) {
    return null;
  }

  return { user: session.user, token };
}

/**
 * Require authenticated agency user
 */
export async function requireAgencyAuth(
  request: NextRequest
): Promise<{ user: AgencyUserWithAgency; token: string }> {
  const result = await getAgencyUserFromRequest(request);

  if (!result) {
    throw new AgencyUnauthorizedError();
  }

  return result;
}

// Note: Role-based access control removed since each agency has only one user
// All authenticated agency users have full access to their agency

