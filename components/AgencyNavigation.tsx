'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Agency, AgencyUserWithAgency } from '@/lib/types';

interface AgencyNavigationProps {
  agency: Agency;
  user?: AgencyUserWithAgency;
  currentPath?: string;
}

export default function AgencyNavigation({ agency, user, currentPath }: AgencyNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryColor = agency.primary_color || '#059669';
  const secondaryColor = agency.secondary_color || '#0ea5e9';

  // Determine current path if not provided
  const activePath = currentPath || pathname || '';

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/agency/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push(`/agency/${agency.subdomain}/login`);
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setLoading(false);
    }
  };

  const isDashboard = activePath.includes('/dashboard');
  const isFormPage = activePath === `/agency/${agency.subdomain}` || activePath === `/agency/${agency.subdomain}/`;

  return (
    <header
      className="bg-white shadow-sm"
      style={{ borderBottomColor: primaryColor, borderBottomWidth: '3px' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href={`/agency/${agency.subdomain}/dashboard`}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              {agency.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="h-10 w-auto"
                />
              ) : (
                <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                  {agency.name}
                </h1>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href={`/agency/${agency.subdomain}/dashboard`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDashboard
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={
                isDashboard
                  ? { backgroundColor: primaryColor }
                  : { color: 'inherit' }
              }
            >
              Dashboard
            </Link>
            <Link
              href={`/agency/${agency.subdomain}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isFormPage
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={
                isFormPage
                  ? { backgroundColor: primaryColor }
                  : { color: 'inherit' }
              }
            >
              Form
            </Link>
          </nav>

          {/* User Menu (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">Agency User</p>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href={`/agency/${agency.subdomain}/dashboard`}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isDashboard
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={
                isDashboard
                  ? { backgroundColor: primaryColor }
                  : { color: 'inherit' }
              }
            >
              Dashboard
            </Link>
            <Link
              href={`/agency/${agency.subdomain}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isFormPage
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={
                isFormPage
                  ? { backgroundColor: primaryColor }
                  : { color: 'inherit' }
              }
            >
              Form
            </Link>
            {user && (
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-3 mb-3">
                  <p className="text-base font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-sm text-gray-500">Agency User</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loading}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

