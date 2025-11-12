'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agency } from '@/lib/types';

interface ResetPasswordClientProps {
  subdomain: string;
  agency: Agency;
  token: string | null;
}

export default function ResetPasswordClient({ subdomain, agency, token }: ResetPasswordClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const primaryColor = agency.primary_color || '#059669';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/agency/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/agency/${subdomain}/login`);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
          </div>
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Invalid reset link
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    The password reset link is invalid or missing. Please request a new password reset.
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href={`/agency/${subdomain}/forgot-password`}
                    className="text-sm font-medium"
                    style={{ color: primaryColor }}
                  >
                    Request new reset link
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
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
          </div>
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Password reset successful!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Your password has been reset successfully. You will be redirected to the login page shortly.
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href={`/agency/${subdomain}/login`}
                    className="text-sm font-medium"
                    style={{ color: primaryColor }}
                  >
                    Go to login →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Set your new password
          </p>
        </div>

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

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
                placeholder="Enter new password (min. 12 characters)"
                minLength={12}
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 12 characters long.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-gray-500 sm:text-sm"
                placeholder="Confirm new password"
                minLength={12}
              />
            </div>
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
              {loading ? 'Resetting password...' : 'Reset password'}
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
      </div>
    </div>
  );
}


