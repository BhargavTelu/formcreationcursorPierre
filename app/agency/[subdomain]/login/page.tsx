import { notFound } from 'next/navigation';
import { Suspense } from 'react';
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

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AgencyLoginClient subdomain={subdomain} agency={agency} />
    </Suspense>
  );
}
