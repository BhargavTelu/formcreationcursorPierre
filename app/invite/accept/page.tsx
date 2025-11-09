import AcceptInviteForm from '@/components/AcceptInviteForm';

interface InviteAcceptPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam || '';

  return <AcceptInviteForm token={token} />;
}



