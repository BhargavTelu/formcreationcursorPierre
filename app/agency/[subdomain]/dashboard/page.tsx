import { redirect } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/agency';
import { validateAgencySession } from '@/lib/agency-auth';
import { cookies } from 'next/headers';
import AgencyDashboardClient from '@/components/AgencyDashboardClient';

export default async function AgencyDashboardPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // Get agency
  const agency = await getAgencyBySubdomain(subdomain);
  if (!agency) {
    redirect(`/agency/${subdomain}/not-found`);
  }

  // Check authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('agency-session-token')?.value;

  if (!token) {
    redirect(`/agency/${subdomain}/login`);
  }

  const session = await validateAgencySession(token);

  if (!session.valid || !session.user || session.user.agency_subdomain !== subdomain) {
    redirect(`/agency/${subdomain}/login`);
  }

  return (
    <AgencyDashboardClient
      agency={agency}
      user={session.user}
    />
  );
}

