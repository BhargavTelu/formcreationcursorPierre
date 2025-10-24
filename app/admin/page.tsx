"use client";
import { useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

export default function AdminPage() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
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
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✓ Agency created successfully! URL: ${subdomain}.${window.location.hostname}`);
        // Reset form
        setName('');
        setSubdomain('');
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
                          href={`http://${agency.subdomain}.${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`}
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


