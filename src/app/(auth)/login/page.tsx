'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Wait for auth state change event to complete
  const waitForAuthStateChange = async (maxWaitTime: number = 8000): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      let subscription: any = null;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          if (subscription) {
            subscription.unsubscribe();
          }
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, maxWaitTime);

      // Subscribe to auth state changes
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (resolved) return;
        subscription = authSubscription;

        if (event === 'SIGNED_IN' && session?.user) {
          // Wait a moment for AuthProvider to process the event
          setTimeout(async () => {
            if (resolved) return;
            
            try {
              // Verify user is still available and session is valid
              const { data: { user }, error } = await supabase.auth.getUser();
              if (user && !error) {
                // Give AuthProvider additional time to fetch profile
                // This ensures ProtectedRoute won't redirect back to login
                setTimeout(() => {
                  if (!resolved) {
                    cleanup();
                    clearTimeout(timeout);
                    resolve(true);
                  }
                }, 800);
              } else {
                // User verification failed
                if (!resolved) {
                  cleanup();
                  clearTimeout(timeout);
                  resolve(false);
                }
              }
            } catch (err) {
              // If check fails
              if (!resolved) {
                cleanup();
                clearTimeout(timeout);
                resolve(false);
              }
            }
          }, 300);
        }
      });
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Wait for auth state change event to fire and complete
      const authReady = await waitForAuthStateChange(8000);
      
      // Always use full page reload to avoid Next.js router cache issues
      // This ensures a clean navigation with fresh auth state
      if (authReady) {
        // Use full page reload to ensure AuthProvider initializes properly
        window.location.href = '/dashboard';
      } else {
        // Even on timeout, use full page reload as it will work after hard refresh
        // The session is established, just needs a fresh page load
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Restaurant POS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}

