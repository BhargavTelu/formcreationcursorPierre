import Link from 'next/link';

export default function AgencyNotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Agency Not Found
        </h1>
        
        <p className="text-gray-600 mb-6">
          The travel agency you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-emerald-600 text-white rounded-md px-4 py-2 font-medium hover:bg-emerald-700 transition-colors"
          >
            Go to Main Site
          </Link>
          
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}


