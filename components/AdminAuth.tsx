"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Simple admin authentication component
 * Use this to sign in before creating agencies
 */
export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Check if user is already signed in
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setMessage('Signed in successfully!');
      
      // Store tokens in cookies for API calls
      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800`;
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Note: Public sign-up removed for security
  // Only invited users can create accounts via /invite/accept

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessage('Signed out');
    
    // Clear cookies
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0';
  };

  // Check user on mount
  if (user === null) {
    checkUser();
  }

  if (user) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">
              Signed in as: {user.email}
            </p>
            <p className="text-xs text-green-600">
              You can now create agencies via the API
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Admin Authentication</h3>
      
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="admin@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
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

        {message && (
          <div className={`rounded-md p-3 text-sm ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-800' 
              : 'bg-blue-50 text-blue-800'
          }`}>
            {message}
          </div>
        )}

            <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">🔒 Admins Only:</span> Don't have an account? Ask an existing administrator to send you an invitation.
        </p>
      </div>
    </div>
  );
}


