"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AgencyRecord {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
}

interface SessionUserResponse {
  success: boolean;
  user?: {
    email: string;
    role: string;
  };
  error?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<AgencyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [secondaryColor, setSecondaryColor] = useState('#0ea5e9');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;
        const payload: SessionUserResponse = await response.json();
        if (payload.success && payload.user) {
          setAdminEmail(payload.user.email);
        }
      } catch (error) {
        console.error('Failed to load current admin session', error);
      }
    };

    fetchSession();
  }, []);

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

  const handleCreateAgency = async (event: React.FormEvent) => {
    event.preventDefault();
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
        const mainDomain = typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'finestafrica.ai';
        setMessage(`✓ Agency created successfully! URL: https://${subdomain}.${mainDomain}`);
        setName('');
        setSubdomain('');
        setEmail('');
        setLogoUrl('');
        setPrimaryColor('#059669');
        setSecondaryColor('#0ea5e9');
        fetchAgencies();
      } else {
        let errorMsg = result.error || result.message || 'Unknown error';

        if (errorMsg.includes('relation') || errorMsg.includes('does not exist')) {
          errorMsg += ' (Did you run the database migration? Check supabase-migration.sql)';
        } else if (errorMsg.includes('already taken')) {
          errorMsg += ' (Try a different subdomain)';
        } else if (errorMsg.includes('Unauthorized') || errorMsg.includes('Forbidden')) {
          errorMsg += ' (Admin access required)';
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

  const handleSignOut = async () => {
    setSigningOut(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to sign out');
      }

      router.push('/admin/sign-in');
      router.refresh();
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Sign out failed'}`);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agency Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage travel agency subdomains and branding for Finest Africa.
            </p>
            {adminEmail ? (
              <p className="mt-1 text-sm text-gray-500">Signed in as {adminEmail}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={fetchAgencies}
              disabled={loading}
              className="rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh Agencies'}
            </button>
            <Link
              href="/admin/invite"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              Invite Admin
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
                  onChange={(event) => handleNameChange(event.target.value)}
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
                  onChange={(event) => setSubdomain(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="wanderlust"
                  pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Agency Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="contact@agency.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Primary contact email for the agency.</p>
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  id="logoUrl"
                  type="url"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
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
                    onChange={(event) => setPrimaryColor(event.target.value)}
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
                    onChange={(event) => setSecondaryColor(event.target.value)}
                    className="mt-1 block h-10 w-full rounded-md border border-gray-300"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.includes('Error')
                    ? 'bg-red-50 text-red-800'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create Agency'}
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Existing Agencies</h2>
            <button
              onClick={fetchAgencies}
              disabled={loading}
              className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Refresh'}
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
                          {agency.logo_url ? (
                            <img src={agency.logo_url} alt="" className="h-6 w-auto" />
                          ) : null}
                          <span className="font-medium">{agency.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{agency.subdomain}</td>
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
                          href={`https://${agency.subdomain}.${typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'finestafrica.ai'}`}
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

