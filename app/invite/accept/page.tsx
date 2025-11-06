"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Invitation Acceptance Page Content
 * Separated to wrap in Suspense boundary
 */
function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [accepting, setAccepting] = useState(false);
  
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('Invalid invitation link - missing token');
      setLoading(false);
    }
  }, [token]);

  // Verify invitation token
  const verifyToken = async () => {
    setVerifying(true);
    setError('');

    try {
      const response = await fetch(`/api/invite/verify?token=${token}`);
      const result = await response.json();

      if (result.valid) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Invalid invitation');
      }
    } catch (err: any) {
      setError('Failed to verify invitation: ' + err.message);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  // Accept invitation and create account
  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccepting(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setAccepting(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setAccepting(false);
      return;
    }

    try {
      // Accept invitation via API
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (result.success && result.data?.session) {
        // Set session in Supabase client
        const { session } = result.data;
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        // Store tokens in cookies for API routes
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=strict`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; secure; samesite=strict`;

        // Show success message
        setMessage('Account created successfully! Redirecting to admin dashboard...');

        // Redirect to admin dashboard
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err: any) {
      setError('Error creating account: ' + err.message);
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2 text-sm text-gray-500 text-left bg-gray-50 rounded p-4">
              <p className="font-medium text-gray-700">Common reasons:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Invitation link has expired (7 days limit)</li>
                <li>Invitation has already been used</li>
                <li>Invitation was revoked by an administrator</li>
                <li>Invalid or corrupted link</li>
              </ul>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state (valid invitation - show password form)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome! 🎉</h1>
          <p className="text-gray-600">
            You've been invited to join as an administrator
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Invitation Info */}
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
            <p className="text-sm text-emerald-800">
              <span className="font-medium">Email:</span> {invitation?.email}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Expires: {new Date(invitation?.expires_at).toLocaleString()}
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Create Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter a strong password"
                required
                minLength={8}
                disabled={accepting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Re-enter password"
                required
                minLength={8}
                disabled={accepting}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="w-full rounded-md bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {accepting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Accept Invitation & Create Account'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">🔒 Security</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your password is encrypted and stored securely</li>
              <li>• You'll have full admin access after account creation</li>
              <li>• Keep your credentials safe and don't share them</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Finest Africa Travel Planning. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/**
 * Invitation Acceptance Page
 * Public page for accepting admin invitations
 * URL: /invite/accept?token=xxx
 */
export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading invitation...</p>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

