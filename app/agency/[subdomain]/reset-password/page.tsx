import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getAgencyBySubdomain } from '@/lib/agency';
import ResetPasswordClient from './reset-password-client';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { subdomain } = await params;
  const { token } = await searchParams;

  const agency = await getAgencyBySubdomain(subdomain);
  if (!agency) {
    notFound();
  }

  if (!token) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
        <ResetPasswordClient subdomain={subdomain} agency={agency} token={null} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordClient subdomain={subdomain} agency={agency} token={token} />
    </Suspense>
  );
}


