import { notFound, redirect } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/agency';
import { validateAgencySession } from '@/lib/agency-auth';
import { cookies } from 'next/headers';
import AgencyForm from '@/components/AgencyForm';

export default async function AgencyPage({
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

  // Check authentication - form requires login
  const cookieStore = await cookies();
  const token = cookieStore.get('agency-session-token')?.value;

  if (!token) {
    // Redirect to login with return URL
    redirect(`/agency/${subdomain}/login?redirect=/agency/${subdomain}`);
  }

  const session = await validateAgencySession(token);

  if (!session.valid || !session.user || session.user.agency_subdomain !== subdomain) {
    // Invalid session, redirect to login
    redirect(`/agency/${subdomain}/login?redirect=/agency/${subdomain}`);
  }

  return (
    <main 
      className="mx-auto max-w-4xl px-4 py-10"
      style={{
        // Set CSS variables for agency branding
        ['--agency-primary' as any]: agency.primary_color,
        ['--agency-secondary' as any]: agency.secondary_color,
      }}
    >
      <AgencyForm agency={agency} />
    </main>
  );
}


