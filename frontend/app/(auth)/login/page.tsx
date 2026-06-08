'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router  = useRouter();
  const { user, loading, login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'pm')         router.replace('/pm/heatmap');
      else if (user.role === 'admin') router.replace('/admin/dashboard');
      else                            router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      // redirect handled by useEffect above
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code.includes('wrong-password') ||
        code.includes('user-not-found') ||
        code.includes('invalid-credential')
      ) {
        setError('Invalid email or password. Please try again.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many failed attempts. Please wait a moment.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sanlam-bg">
        <div className="w-8 h-8 border-4 border-sanlam-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL — branded, hidden on mobile */}
      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #015376 0%, #013d5c 100%)' }}
      >
        {/* Teal radial highlight top-left */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,181,237,0.15) 0%, transparent 70%)' }}
        />

        {/* Decorative circles bottom-right — Sanlam brand motif */}
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          width="400"
          height="400"
          viewBox="0 0 400 400"
        >
          <circle cx="400" cy="400" r="280" fill="none" stroke="rgba(0,181,237,0.10)" strokeWidth="80" />
          <circle cx="400" cy="400" r="160" fill="none" stroke="rgba(0,181,237,0.07)" strokeWidth="60" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <p className="text-white font-light text-lg tracking-widest">Sanlam</p>
          <p className="text-[#00B5ED] text-lg tracking-widest">Investments</p>
        </div>

        {/* Centre content */}
        <div className="relative z-10">
          <h1 className="text-white font-bold text-5xl mb-2">InvestScore</h1>
          <p className="text-white/70 text-base mb-10">SDG Scorecard Platform</p>
          <div className="flex flex-col gap-4">
            {[
              "Sanlam's SDG methodology, digitised",
              'Transparent scoring across all 17 goals',
              'Powered by real South African SME data',
            ].map((line) => (
              <div key={line} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00B5ED] flex-shrink-0" />
                <p className="text-white/85 text-sm">{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/40 text-xs">
          Twin Transition Challenge 2026
        </p>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="relative flex-1 flex items-center justify-center p-6" style={{ background: 'var(--bg, #F4F6F8)' }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <p className="text-[#015376] font-bold text-3xl">InvestScore</p>
            <p className="text-[#4A5568] text-sm">by Sanlam Investments</p>
          </div>

          <h2 className="font-semibold text-2xl mb-1" style={{ color: 'var(--text-primary, #015376)' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted, #4A5568)' }}>Sign in to your InvestScore portal</p>

          {/* Error alert */}
          {error && (
            <div className="flex items-start justify-between gap-3 bg-red-50 border border-[#D0021B] rounded-md p-3 mb-5">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#015376] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@company.co.za"
              className="w-full h-11 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition"
              style={{ border: '1px solid var(--border, #DDE3EC)', background: 'var(--surface, #fff)', color: 'var(--text-primary, #015376)' }}
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-[#015376] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full h-11 px-3 pr-10 rounded-lg border border-[#DDE3EC] bg-white text-[#015376] placeholder:text-[#4A5568]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition"
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#015376] transition"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end mb-6">
            <button className="text-[#00B5ED] text-xs hover:underline">
              Forgot password?
            </button>
          </div>

          {/* Sign in button */}
          <button
            onClick={handleLogin}
            disabled={busy}
            className="w-full h-12 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] active:bg-[#007BA8] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
          >
            {busy ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#DDE3EC]" />
            <span className="text-[#4A5568] text-xs">New to InvestScore?</span>
            <div className="flex-1 h-px bg-[#DDE3EC]" />
          </div>

          {/* Register button */}
          <button
            onClick={() => router.push('/register')}
            className="w-full h-12 rounded-lg border border-[#00B5ED] text-[#00B5ED] font-semibold text-sm hover:bg-[#C9EEFB] active:bg-[#C9EEFB]/70 transition mb-8"
          >
            Register your company
          </button>

        </div>
      </div>
    </div>
  );
}
