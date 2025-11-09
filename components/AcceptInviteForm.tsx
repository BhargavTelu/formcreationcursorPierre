"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptInviteFormProps {
  token: string;
}

type ValidationState =
  | { status: 'validating' }
  | { status: 'invalid'; message: string }
  | { status: 'valid'; email: string; expiresAt: string | null };

type MessageState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();
  const [validation, setValidation] = useState<ValidationState>({ status: 'validating' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    if (!token) {
      setValidation({ status: 'invalid', message: 'Missing invitation token.' });
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to validate invitation.');
        }

        setValidation({ status: 'valid', email: payload.data.email, expiresAt: payload.data.expiresAt });
      } catch (error: any) {
        setValidation({
          status: 'invalid',
          message: error.message || 'This invitation link is no longer valid.',
        });
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ tone: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to activate administrator account.');
      }

      if (payload.warning) {
        setMessage({ tone: 'info', text: payload.warning });
      } else {
        setMessage({ tone: 'success', text: 'Invitation accepted. Redirecting to admin dashboard…' });
      }

      setTimeout(() => {
        router.push('/admin/dashboard');
        router.refresh();
      }, 1200);
    } catch (error: any) {
      setMessage({ tone: 'error', text: error.message || 'Failed to accept invitation.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (validation.status === 'validating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">Validating invitation…</p>
        </div>
      </div>
    );
  }

  if (validation.status === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-red-700">Invitation Error</h1>
          <p className="mt-3 text-sm text-gray-600">{validation.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Activate Administrator Access</h1>
          <p className="mt-2 text-sm text-gray-600">
            Invitation for <span className="font-medium text-gray-900">{validation.email}</span>
          </p>
          {validation.expiresAt ? (
            <p className="mt-1 text-xs text-gray-500">
              Invitation expires on {new Date(validation.expiresAt).toLocaleString()}.
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Set Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
                minLength={12}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 12 characters. Use a mix of letters, numbers, and symbols.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={12}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.tone === 'error'
                    ? 'bg-red-50 text-red-800'
                    : message.tone === 'success'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-blue-50 text-blue-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Activating…' : 'Activate Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



