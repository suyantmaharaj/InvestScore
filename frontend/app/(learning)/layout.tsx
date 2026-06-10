'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LearningTopNav from '@/components/learning/LearningTopNav';
import { ThemeProvider } from '@/lib/theme';

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user?.role === 'pm') router.replace('/heatmap');
    if (!loading && user?.role === 'admin') router.replace('/admin/dashboard');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--sanlam-teal)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <LearningTopNav />
        <main style={{ paddingTop: '56px' }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
