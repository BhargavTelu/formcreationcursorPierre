import { notFound } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/agency';
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


