'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Agency, AgencyUserWithAgency } from '@/lib/types';
import AgencyNavigation from '@/components/AgencyNavigation';

interface AgencyDashboardClientProps {
  agency: Agency;
  user: AgencyUserWithAgency;
}

export default function AgencyDashboardClient({ agency, user }: AgencyDashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const primaryColor = agency.primary_color || '#059669';
  const secondaryColor = agency.secondary_color || '#0ea5e9';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <AgencyNavigation
        agency={agency}
        user={user}
        currentPath={`/agency/${agency.subdomain}/dashboard`}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-600">
                Welcome to your agency dashboard
              </p>
            </div>
            <a
              href={`/agency/${agency.subdomain}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Form
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className="rounded-md p-3"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <svg
                      className="h-6 w-6"
                      style={{ color: primaryColor }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className="rounded-md p-3"
                    style={{ backgroundColor: `${secondaryColor}20` }}
                  >
                    <svg
                      className="h-6 w-6"
                      style={{ color: secondaryColor }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Account Status
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Active
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agency Info Card */}
        <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Agency Information
            </h3>
            <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Agency Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{agency.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                <dd className="mt-1 text-sm text-gray-900">{agency.subdomain}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{agency.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Your Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}

