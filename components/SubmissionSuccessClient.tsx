'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SubmissionSuccessClientProps {
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  agencyName: string;
}

export default function SubmissionSuccessClient({
  subdomain,
  primaryColor,
  secondaryColor,
  agencyName,
}: SubmissionSuccessClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeType = searchParams.get('type') || 'submission';

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      router.push(`/agency/${subdomain}/dashboard?refresh=true`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, subdomain]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full mb-6 animate-bounce"
               style={{ backgroundColor: `${primaryColor}20` }}>
            <svg
              className="h-12 w-12"
              style={{ color: primaryColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Submission Successful!
          </h2>

          <p className="text-lg text-gray-600 mb-2">
            {routeType === 'predefined'
              ? 'Your pre-defined route selection has been submitted successfully.'
              : 'Your trip design form has been submitted successfully.'}
          </p>

          <p className="text-sm text-gray-500 mb-8">
            We will contact you soon with your travel planning details.
          </p>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-gray-600">
                    Redirecting to dashboard...
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center animate-progress"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </div>

          {/* Agency branding */}
          <p className="text-xs text-gray-400">
            Powered by {agencyName}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}





