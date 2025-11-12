import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAgencyBySubdomain } from '@/lib/agency';
import ForgotPasswordClient from './forgot-password-client';

export default async function ForgotPasswordPage({
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
      <ForgotPasswordClient subdomain={subdomain} agency={agency} />
    </Suspense>
  );
}


