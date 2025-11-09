import { notFound } from 'next/navigation';
import { getAgencyBySubdomain } from '@/lib/agency';
import AgencyLoginClient from './login-client';

export default async function AgencyLoginPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const agency = await getAgencyBySubdomain(subdomain);
  if (!agency) {
    notFound();
  }

  return <AgencyLoginClient subdomain={subdomain} agency={agency} />;
}
