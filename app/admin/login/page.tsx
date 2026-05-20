'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'admin@piecup.cci';
const ADMIN_PASSWORD = 'PieCupLagos100!';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? 'Login failed');
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError('Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#111111] border border-[#1a1a1a] rounded-3xl p-8 shadow-xl shadow-black/30">
        <div className="mb-8 text-center">
          <p className="font-condensed uppercase tracking-[0.35em] text-[#00E676] text-xs mb-3">Admin login</p>
          <h1 className="text-3xl font-black tracking-tight">CCI Football</h1>
          <p className="mt-3 text-sm text-[#888888]">Sign in with the admin credentials to manage fixtures, teams, and events.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
              className="w-full bg-[#0f0f0f] border border-[#222222] rounded-xl px-4 py-3 text-white placeholder-[#444444] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-[#0f0f0f] border border-[#222222] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#444444] focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 inline-flex items-center justify-center rounded-full px-2 text-[#888888] hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10a9.957 9.957 0 011.782-5.735" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 4.318l15.364 15.364" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 9.75a3 3 0 014.5 4.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-800 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-xl bg-[#00E676] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#8cff91] disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-[#0b0b0b] border border-[#222222] px-4 py-4 text-sm text-slate-500">
          <p><span className="font-semibold text-white">Example email:</span> john.doe@example.com</p>
          <p><span className="font-semibold text-white">Password:</span> PieCupLagos100!</p>
        </div>
      </div>
    </div>
  );
}
