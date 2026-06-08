'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SMESideNav from '@/components/sme/SMESideNav';
import PageHeader from '@/components/shared/PageHeader';
import { SMEDataProvider } from '@/context/SMEDataContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useSMEKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function SMEShell({ children }: { children: React.ReactNode }) {
  useSMEKeyboardShortcuts();
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg, #F4F6F8)' }}>
      <SMESideNav />
      <div className="lg:ml-60 flex-1 flex flex-col min-h-screen">
        <PageHeader />
        <main className="flex-1 p-5 lg:p-8 pt-24 lg:pt-24">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function SMELayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (!loading && user && user.role !== 'sme') {
      if (user.role === 'pm')    router.replace('/pm/heatmap');
      if (user.role === 'admin') router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg, #F4F6F8)' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00B5ED', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <SMEDataProvider>
      <SMEShell>{children}</SMEShell>
    </SMEDataProvider>
  );
}
