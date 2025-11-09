"use client";
import { useState, useEffect } from 'react';

interface AdminInviteProps {
  adminRole: 'super_admin' | 'admin';
}

export default function AdminInvite({ adminRole }: AdminInviteProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);

  // Fetch existing invitations
  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const response = await fetch('/api/admin/invitations');
      const result = await response.json();

      if (response.ok) {
        setInvitations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  // Send invitation
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setInvitationUrl(null);

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✓ Invitation sent to ${email}`);
        setInvitationUrl(result.invitation?.invitation_url);
        setEmail('');
        setRole('admin');
        // Refresh invitations list
        fetchInvitations();
      } else {
        setMessage(`Error: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Revoke invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✓ Invitation revoked successfully');
        fetchInvitations();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Copy invitation URL
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('✓ Invitation URL copied to clipboard');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error copying to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Invitation Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Invite New Admin</h2>
        
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="newadmin@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={adminRole !== 'super_admin'}
            >
              <option value="admin">Admin</option>
              {adminRole === 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
            {adminRole !== 'super_admin' && (
              <p className="mt-1 text-xs text-gray-500">
                Only super admins can invite other super admins
              </p>
            )}
          </div>

          {message && (
            <div className={`rounded-md p-3 text-sm ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-800' 
                : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {invitationUrl && (
            <div className="rounded-md bg-blue-50 p-4">
              <p className="mb-2 text-sm font-medium text-blue-800">
                Invitation Created! Share this URL:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invitationUrl}
                  readOnly
                  className="flex-1 rounded border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(invitationUrl)}
                  className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Note: In production, this URL will be sent via email automatically. For development, copy and share this URL.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Invitations List */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
          <button
            onClick={fetchInvitations}
            disabled={loadingInvitations}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingInvitations ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {invitations.length === 0 ? (
          <p className="text-gray-500">No pending invitations</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-3 text-sm">{invitation.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        invitation.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {invitation.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        invitation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invitation.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : invitation.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {invitation.status === 'pending' && (
                        <button
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}






