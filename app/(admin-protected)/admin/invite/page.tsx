"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';

interface InvitationRecord {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string | null;
  accepted_at: string | null;
  last_sent_at: string | null;
  created_at: string | null;
}

type Message = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

export default function AdminInvitePage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/invite', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load invitations');
      }

      setInvitations(payload.data || []);
    } catch (error: any) {
      console.error('Failed to load invitations', error);
      setMessage({ tone: 'error', text: error.message || 'Unable to load invitations.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const pendingInvites = useMemo(
    () => invitations.filter((invite) => invite.status === 'pending'),
    [invitations]
  );

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send invitation');
      }

      setEmail('');
      await loadInvitations();

      // Show success message - never display the invite URL
      setMessage({
        tone: 'success',
        text: `Invitation email sent successfully to ${email}.`,
      });
    } catch (error: any) {
      setMessage({ tone: 'error', text: error.message || 'Failed to send invitation.' });
    } finally {
      setSending(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invite New Administrator</h1>
          <p className="mt-2 text-gray-600">
            Send a one-time secure invitation to grant admin access. Invitations expire after 48 hours.
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Send Invitation</h2>

          <form className="space-y-4" onSubmit={handleInvite}>
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                Administrator Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="new.admin@finestafrica.ai"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Only trusted team members should receive admin access.
              </p>
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
                <div>{message.text}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send Invitation'}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Invitation History</h2>
            <button
              onClick={loadInvitations}
              disabled={loading}
              className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {invitations.length === 0 ? (
            <p className="text-gray-500">No invitations have been issued yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-gray-500">Expires</th>
                    <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-gray-500">Last Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invitations.map((invite) => {
                    const expiresLabel = invite.expires_at
                      ? new Date(invite.expires_at).toLocaleString()
                      : '—';
                    const lastSentLabel = invite.last_sent_at
                      ? new Date(invite.last_sent_at).toLocaleString()
                      : '—';

                    return (
                      <tr key={invite.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{invite.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              invite.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200'
                                : invite.status === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                                  : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200'
                            }`}
                          >
                            {invite.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{expiresLabel}</td>
                        <td className="px-4 py-3 text-gray-600">{lastSentLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pendingInvites.length > 0 ? (
            <p className="mt-4 text-xs text-gray-500">
              Pending invitations ({pendingInvites.length}) will expire automatically after 48 hours.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}


