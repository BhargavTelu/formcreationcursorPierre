"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Admin authentication component
 * Only allows sign-in for users who are in the admin_users table
 */
export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

  // Forgot password / Reset password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setMessage('');

    try {
      // First, check if email is in admin_users table
      const checkResponse = await fetch('/api/admin/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResult.success) {
        setMessage(`Error: ${checkResult.error || 'This email is not authorized to access the admin panel.'}`);
        return;
      }

      // If email is in admin list, send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin?reset=true`,
      });

      if (error) throw error;

      setMessage('Password reset email sent! Check your inbox for instructions.');
      setShowForgotPassword(false);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

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
              You can now manage agencies and invite other admins
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
      
      {!showForgotPassword ? (
        <form onSubmit={handleSignIn} className="space-y-4">
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
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setMessage('');
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            Forgot password or first time setup?
          </button>
        </form>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="admin@example.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Only authorized admin emails can reset their password
            </p>
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={forgotPasswordLoading}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {forgotPasswordLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setMessage('');
              }}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </form>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Only users authorized by a super admin can access this panel.
      </p>
    </div>
  );
}


