'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SMESideNav from '@/components/sme/SMESideNav';
import PageHeader from '@/components/shared/PageHeader';
import { SMEDataProvider } from '@/context/SMEDataContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useSMEKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function SMEShell({ children }: { children: React.ReactNode }) {
  useSMEKeyboardShortcuts();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex"
      style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      <SMESideNav collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        className={`flex flex-col ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}
        style={{
          flex:       1,
          height:     '100vh',
          overflow:   'hidden',
          minWidth:   0,
          transition: 'margin-left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <PageHeader />
        <main
          className="p-5 pt-5 lg:p-8"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
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
