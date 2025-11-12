'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agency } from '@/lib/types';

interface ForgotPasswordClientProps {
  subdomain: string;
  agency: Agency;
}

export default function ForgotPasswordClient({ subdomain, agency }: ForgotPasswordClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const primaryColor = agency.primary_color || '#059669';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/agency/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          agency_subdomain: subdomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          {agency.logo_url ? (
            <img
              src={agency.logo_url}
              alt={agency.name}
              className="mx-auto h-16 w-auto object-contain"
            />
          ) : (
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              {agency.name}
            </h2>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Reset your password
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Password reset link sent!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    If an account exists with this email, we've sent a password reset link.
                    Please check your email and click the link to reset your password.
                  </p>
                  <p className="mt-2">
                    The link will expire in 1 hour.
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href={`/agency/${subdomain}/login`}
                    className="text-sm font-medium"
                    style={{ color: primaryColor }}
                  >
                    ← Back to login
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
                placeholder="Enter your email address"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>

            <div className="text-center">
              <a
                href={`/agency/${subdomain}/login`}
                className="text-sm font-medium"
                style={{ color: primaryColor }}
              >
                ← Back to login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


