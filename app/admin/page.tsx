"use client";
import { useState, useEffect } from 'react';
import AdminAuth from '@/components/AdminAuth';

export default function AdminPage() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  // Admin invitation state
  const [adminEmail, setAdminEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [secondaryColor, setSecondaryColor] = useState('#0ea5e9');

  // Auto-generate subdomain from name
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!subdomain) {
      const slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSubdomain(slug);
    }
  };

  // Fetch agencies
  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/agencies');
      const result = await response.json();

      if (response.ok) {
        setAgencies(result.data || []);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch admins
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const response = await fetch('/api/admin/invite');
      const result = await response.json();

      if (response.ok) {
        setAdmins(result.data || []);
      } else {
        setInviteMessage(`Error: ${result.error}`);
      }
    } catch (error: any) {
      setInviteMessage(`Error: ${error.message}`);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Invite new admin
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteMessage('');

    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        setInviteMessage(`✓ ${result.message}`);
        setAdminEmail('');
        fetchAdmins(); // Refresh admin list
      } else {
        setInviteMessage(`Error: ${result.error || 'Failed to invite admin'}`);
      }
    } catch (error: any) {
      setInviteMessage(`Error: ${error.message}`);
    } finally {
      setInviting(false);
    }
  };

  // Load admins and agencies on mount (if user is signed in)
  useEffect(() => {
    // Small delay to ensure auth state is ready
    const timer = setTimeout(() => {
      fetchAdmins();
      fetchAgencies();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Create agency
  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subdomain,
          email,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Get the main domain (remove www if present)
        const mainDomain = window.location.hostname.replace(/^www\./, '');
        setMessage(`✓ Agency created successfully! URL: https://${subdomain}.${mainDomain}`);
        // Reset form
        setName('');
        setSubdomain('');
        setEmail('');
        setLogoUrl('');
        setPrimaryColor('#059669');
        setSecondaryColor('#0ea5e9');
        // Refresh list
        fetchAgencies();
      } else {
        // Show detailed error message
        let errorMsg = result.error || result.message || 'Unknown error';
        
        // Add helpful hints based on error
        if (errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
          errorMsg += ' (Did you run the database migration? Check supabase-migration.sql)';
        } else if (errorMsg.includes('already taken')) {
          errorMsg += ' (Try a different subdomain)';
        } else if (errorMsg.includes('Unauthorized')) {
          errorMsg += ' (Please sign in first)';
        }
        
        setMessage(`Error: ${errorMsg}`);
        console.error('Full error details:', result);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message} (Check console for details)`);
      console.error('Create agency error:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agency Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage travel agency subdomains and branding
          </p>
        </div>

        {/* Authentication */}
        <div className="mb-8">
          <AdminAuth />
        </div>

        {/* Invite Admin Section */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Admin Management</h2>
            <button
              onClick={fetchAdmins}
              disabled={loadingAdmins}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {loadingAdmins ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <form onSubmit={handleInviteAdmin} className="mb-6 space-y-4">
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                Invite New Admin
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="newadmin@example.com"
                  required
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The new admin will receive an email to set their password
              </p>
            </div>

            {inviteMessage && (
              <div className={`rounded-md p-3 text-sm ${
                inviteMessage.includes('Error') 
                  ? 'bg-red-50 text-red-800' 
                  : 'bg-green-50 text-green-800'
              }`}>
                {inviteMessage}
              </div>
            )}
          </form>

          {/* Admins List */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Current Admins</h3>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-500">No admins yet. Invite one above!</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Invited At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {admins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-4 py-2 text-sm">{admin.email}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                            admin.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : admin.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {admin.invited_at 
                            ? new Date(admin.invited_at).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Agency Form */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Create New Agency</h2>
          
          <form onSubmit={handleCreateAgency} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Agency Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Wanderlust Travel"
                  required
                />
              </div>

              <div>
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                  Subdomain *
                </label>
                <input
                  id="subdomain"
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="wanderlust"
                  pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Agency Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="contact@agency.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Contact email for communication
                </p>
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="mt-1 block h-10 w-full rounded-md border border-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="mt-1 block h-10 w-full rounded-md border border-gray-300"
                  />
                </div>
              </div>
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

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Agency'}
            </button>
          </form>
        </div>

        {/* Agencies List */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Existing Agencies</h2>
            <button
              onClick={fetchAgencies}
              disabled={loading}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {agencies.length === 0 ? (
            <p className="text-gray-500">No agencies yet. Create one above!</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Agency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Subdomain
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Colors
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {agencies.map((agency) => (
                    <tr key={agency.id}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {agency.logo_url && (
                            <img
                              src={agency.logo_url}
                              alt=""
                              className="h-6 w-auto"
                            />
                          )}
                          <span className="font-medium">{agency.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {agency.subdomain}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <div
                            className="h-6 w-6 rounded border border-gray-300"
                            style={{ backgroundColor: agency.primary_color }}
                            title={agency.primary_color}
                          />
                          <div
                            className="h-6 w-6 rounded border border-gray-300"
                            style={{ backgroundColor: agency.secondary_color }}
                            title={agency.secondary_color}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(agency.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://${agency.subdomain}.${window.location.hostname.replace(/^www\./, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


