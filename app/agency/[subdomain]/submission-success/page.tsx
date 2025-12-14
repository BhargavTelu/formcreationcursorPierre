import { notFound, redirect } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/agency';
import { validateAgencySession } from '@/lib/agency-auth';
import { cookies } from 'next/headers';
import SubmissionSuccessClient from '@/components/SubmissionSuccessClient';

export default async function SubmissionSuccessPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // Fetch agency data
  const agency = await getAgencyBySubdomain(subdomain);

  // If agency doesn't exist, show 404
  if (!agency) {
    notFound();
  }

  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('agency-session-token')?.value;

  if (!token) {
    // Redirect to login
    redirect(`/agency/${subdomain}/login?redirect=/agency/${subdomain}/dashboard`);
  }

  const session = await validateAgencySession(token);

  if (!session.valid || !session.user || session.user.agency_subdomain !== subdomain) {
    // Invalid session, redirect to login
    redirect(`/agency/${subdomain}/login?redirect=/agency/${subdomain}/dashboard`);
  }

  return (
    <SubmissionSuccessClient
      subdomain={subdomain}
      primaryColor={agency.primary_color || '#059669'}
      secondaryColor={agency.secondary_color || '#0ea5e9'}
      agencyName={agency.name}
    />
  );
}






