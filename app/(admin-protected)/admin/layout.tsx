import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionWithProfile } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile } = await getSessionWithProfile();

  if (!user || !profile || profile.role !== 'admin') {
    redirect('/login');
  }

  return <>{children}</>;
}



