'use client';

import { useState } from 'react';
import { useAuth } from '@/shared/hooks';
import { UserRole } from '@/shared/types';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.user) {
        if (result.user.role === UserRole.RESPONDER) {
          window.location.href = '/responder';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);

    try {
      const result = await login(demoEmail, demoPass);
      if (result.success && result.user) {
        if (result.user.role === UserRole.RESPONDER) {
          window.location.href = '/responder';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Failed to login with demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-3 sm:p-4 bg-cover bg-center bg-no-repeat overflow-y-auto"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2071&auto=format&fit=crop')`,
      }}
    >
      {/* Dark tint overlay for high text legibility */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />

      <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 w-full max-w-md my-auto py-2">
        {/* Login Panel Card */}
        <div className="w-full bg-slate-950/40 backdrop-blur-xl border border-white/20 p-6 sm:p-7 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-4 w-full">
            <img
              src="/safesight-logo-transparent.png?v=8"
              alt="SafeSight"
              className="w-40 sm:w-48 max-w-full h-auto object-contain drop-shadow-lg"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/60 text-red-100 p-2.5 rounded-xl text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-slate-200 text-xs font-medium mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@safesight.local"
                required
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f766e] transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-200 text-xs font-medium mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f766e] transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] text-white font-bold rounded-xl shadow-lg shadow-[#0f766e]/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1 text-sm cursor-pointer"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-[11px] text-slate-400 text-center mb-2.5 font-semibold uppercase tracking-wider">
              Quick One-Click Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@safesight.local', 'safesight123')}
                className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-left transition-all group cursor-pointer"
              >
                <span className="block text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  👔 Site Manager
                </span>
                <span className="block text-[10px] text-slate-400 truncate">manager@safesight.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('responder@safesight.local', 'safesight123')}
                className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl text-left transition-all group cursor-pointer"
              >
                <span className="block text-xs font-bold text-rose-400 group-hover:text-rose-300">
                  🚑 Responder
                </span>
                <span className="block text-[10px] text-slate-400 truncate">responder@safesight.local</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="text-center px-4 py-0.5 select-none">
          <p className="text-sm sm:text-base md:text-lg text-white/95 text-center font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            Tourism is a Right, Not a Privilege.
          </p>
          <div className="w-12 h-0.5 bg-[#0f766e] mx-auto mt-1.5 rounded-full shadow-sm" />
        </div>
      </div>
    </div>
  );
}
