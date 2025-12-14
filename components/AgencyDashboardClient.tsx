'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Agency, AgencyUserWithAgency, FormSubmission } from '@/lib/types';
import AgencyNavigation from '@/components/AgencyNavigation';

interface AgencyDashboardClientProps {
  agency: Agency;
  user: AgencyUserWithAgency;
}

export default function AgencyDashboardClient({ agency, user }: AgencyDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const primaryColor = agency.primary_color || '#059669';
  const secondaryColor = agency.secondary_color || '#0ea5e9';

  // Fetch submissions on component mount and when refresh parameter is present
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        // Add timestamp to bust browser cache
        const timestamp = Date.now();
        const response = await fetch(`/api/submissions?agency_id=${agency.id}&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        const result = await response.json();

        console.log('[Dashboard] Fetched submissions:', result);

        if (result.success && result.data) {
          setSubmissions(result.data);
          console.log('[Dashboard] Submissions count:', result.data.length);
        } else {
          console.error('[Dashboard] Failed to fetch submissions:', result.error);
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();

    // If we have a refresh parameter, remove it from the URL
    if (searchParams.get('refresh')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [agency.id, searchParams]);

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedSubmission(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                    <dd className="text-lg font-medium text-gray-900">
                      {loading ? '...' : submissions.length}
                    </dd>
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

        {/* Submissions Section */}
        <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-5">
              Form Submissions
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" 
                     style={{ color: primaryColor }}
                     role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by submitting your first travel planning form.
                </p>
                <div className="mt-6">
                  <a
                    href={`/agency/${agency.subdomain}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg
                      className="mr-2 -ml-1 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Submit New Form
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <ul role="list" className="divide-y divide-gray-200">
                  {submissions.map((submission, index) => (
                    <li
                      key={submission.id}
                      className="py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                                style={{ backgroundColor: primaryColor }}
                              >
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {submission.client_name}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm text-gray-500">
                                  {formatDate(submission.created_at)}
                                </p>
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: submission.route_preference === 'predefined' ? `${primaryColor}15` : `${secondaryColor}15`,
                                    color: submission.route_preference === 'predefined' ? primaryColor : secondaryColor,
                                  }}
                                >
                                  {submission.route_preference === 'predefined' ? 'Pre-defined Route' : 'Trip Design'}
                                </span>
                                {submission.num_travellers && (
                                  <span className="text-sm text-gray-500">
                                    {submission.num_travellers} {submission.num_travellers === 1 ? 'traveler' : 'travelers'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Submission Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Submission Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto px-6 py-6 max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Submission Info */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Submission Information
                    </h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Submitted On</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedSubmission.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Route Type</dt>
                        <dd className="mt-1">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: selectedSubmission.route_preference === 'predefined' ? `${primaryColor}15` : `${secondaryColor}15`,
                              color: selectedSubmission.route_preference === 'predefined' ? primaryColor : secondaryColor,
                            }}
                          >
                            {selectedSubmission.route_preference === 'predefined' ? 'Pre-defined Route' : 'Trip Design'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Client Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedSubmission.client_name}</dd>
                      </div>
                      {selectedSubmission.num_travellers && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Number of Travelers</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedSubmission.num_travellers}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Form Data */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Form Details
                    </h4>
                    <div className="bg-gray-50 rounded-md p-4">
                      {selectedSubmission.form_data && (
                        <dl className="space-y-4">
                          {Object.entries(selectedSubmission.form_data).map(([key, value]) => {
                            // Skip displaying routePreference as it's already shown above
                            if (key === 'routePreference') return null;
                            
                            // Format the key for display
                            const formattedKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim();

                            // Format the value for display
                            let formattedValue: string;
                            if (Array.isArray(value)) {
                              if (value.length === 0) {
                                formattedValue = 'None';
                              } else if (typeof value[0] === 'object') {
                                // Handle arrays of objects (like travelMonths)
                                formattedValue = value.map((v: any) => v.label || v.value || JSON.stringify(v)).join(', ');
                              } else {
                                formattedValue = value.join(', ');
                              }
                            } else if (typeof value === 'object' && value !== null) {
                              formattedValue = JSON.stringify(value, null, 2);
                            } else if (typeof value === 'boolean') {
                              formattedValue = value ? 'Yes' : 'No';
                            } else if (value === null || value === undefined || value === '') {
                              formattedValue = 'Not specified';
                            } else {
                              formattedValue = String(value);
                            }

                            return (
                              <div key={key}>
                                <dt className="text-sm font-medium text-gray-700">{formattedKey}</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{formattedValue}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

