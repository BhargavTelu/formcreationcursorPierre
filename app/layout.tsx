import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel Planning Form',
  description: 'Ported from static HTML to Next.js 14 App Router with Tailwind',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">{children}</body>
    </html>
  );
}


