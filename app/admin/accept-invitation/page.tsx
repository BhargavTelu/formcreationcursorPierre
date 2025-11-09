"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const validateToken = async () => {
    setValidating(true);
    try {
      const response = await fetch(`/api/admin/accept-invitation?token=${token}`);
      const result = await response.json();

      if (response.ok && result.valid) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Invalid or expired invitation');
      }
    } catch (error) {
      setError('Failed to validate invitation');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const allStrengthChecks = Object.values(passwordStrength).every(check => check);
    if (!allStrengthChecks) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setError(result.error || result.message || 'Failed to create account');
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mb-4 text-gray-600">Validating invitation...</div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Invalid Invitation
          </h1>
          <p className="mb-6 text-center text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/admin')}
            className="w-full rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (message && message.includes('successfully')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg border border-green-200 bg-white p-8">
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Account Created!
          </h1>
          <p className="mb-6 text-center text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accept Admin Invitation</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your admin account for <strong>{invitation?.email}</strong>
          </p>
          <div className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Role: {invitation?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Password strength indicators */}
          {password && (
            <div className="rounded-md bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-700">Password Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li className={passwordStrength.length ? 'text-green-600' : 'text-gray-500'}>
                  {passwordStrength.length ? '✓' : '○'} At least 8 characters
                </li>
                <li className={passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}>
                  {passwordStrength.uppercase ? '✓' : '○'} One uppercase letter
                </li>
                <li className={passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}>
                  {passwordStrength.lowercase ? '✓' : '○'} One lowercase letter
                </li>
                <li className={passwordStrength.number ? 'text-green-600' : 'text-gray-500'}>
                  {passwordStrength.number ? '✓' : '○'} One number
                </li>
                <li className={passwordStrength.special ? 'text-green-600' : 'text-gray-500'}>
                  {passwordStrength.special ? '✓' : '○'} One special character
                </li>
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !Object.values(passwordStrength).every(check => check)}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        <div className="mt-6 rounded-md bg-blue-50 p-3">
          <p className="text-xs text-blue-800">
            After creating your account, you'll be redirected to the admin login page where you can sign in with your new credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <AcceptInvitationForm />
    </Suspense>
  );
}






