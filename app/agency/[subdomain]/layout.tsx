import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  
  // You could fetch agency data here to customize metadata further
  return {
    title: `Travel Planning - ${subdomain}`,
    description: 'Plan your perfect African safari and travel experience',
  };
}

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


