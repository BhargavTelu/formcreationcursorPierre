"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { Invitation } from '@/lib/auth';

/**
 * Admin Invitation Page
 * Only accessible to authenticated admin users
 * Allows admins to invite new admin users via email
 */
export default function AdminInvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Invitation form state
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  // Invitations list state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/admin');
        return;
      }

      setUser(user);

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/admin');
        return;
      }

      setIsAdmin(true);
      setLoading(false);

      // Load invitations
      fetchInvitations();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin');
    }
  };

  // Fetch all invitations
  const fetchInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const response = await fetch('/api/admin/invite');
      const result = await response.json();

      if (result.success) {
        setInvitations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Send invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');
    setInviteUrl('');

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(result.message || 'Invitation sent successfully! ✓');
        setEmail('');
        
        // Show invite URL in development
        if (result.data.inviteUrl) {
          setInviteUrl(result.data.inviteUrl);
        }

        // Refresh invitations list
        fetchInvitations();
      } else {
        setMessage(`Error: ${result.error || 'Failed to send invitation'}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Revoke invitation
  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invite?id=${invitationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchInvitations();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Check if invitation is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invite Admin Users</h1>
              <p className="mt-2 text-gray-600">
                Send secure invitations to new administrators
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Current User Info */}
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Signed in as: {user?.email}
          </p>
        </div>

        {/* Invitation Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Send New Invitation</h2>
          
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="admin@example.com"
                required
                disabled={sending}
              />
              <p className="mt-1 text-xs text-gray-500">
                The user will receive an email with a secure link to set their password and join as an admin.
              </p>
            </div>

            {message && (
              <div className={`rounded-md p-3 text-sm ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {inviteUrl && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  🔗 Development Mode - Invitation Link:
                </p>
                <code className="block rounded bg-white p-2 text-xs text-blue-900 break-all border border-blue-200">
                  {inviteUrl}
                </code>
                <p className="mt-2 text-xs text-blue-600">
                  Copy this link and share it with the user (development only - in production, link is sent via email)
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        {/* Invitations List */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Invitation History</h2>
            <button
              onClick={fetchInvitations}
              disabled={loadingInvitations}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {loadingInvitations ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {invitations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invitations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invitation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : invitation.status === 'pending' && !isExpired(invitation.expires_at)
                            ? 'bg-yellow-100 text-yellow-800'
                            : invitation.status === 'revoked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.status === 'pending' && isExpired(invitation.expires_at)
                            ? 'expired'
                            : invitation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(invitation.expires_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(invitation.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                          <button
                            onClick={() => handleRevokeInvite(invitation.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
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

        {/* Security Notice */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">🔒 Security Notes</h3>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Invitations expire after 7 days</li>
            <li>Each invitation can only be used once</li>
            <li>Invited users automatically receive admin role</li>
            <li>You can revoke pending invitations at any time</li>
            <li>All invitation activities are logged and auditable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

