'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PMSideNav from '@/components/pm/PMSideNav';
import PageHeader from '@/components/shared/PageHeader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function PMLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user)                  router.replace('/login');
    if (!loading && user?.role === 'sme')   router.replace('/dashboard');
    if (!loading && user?.role === 'admin') router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--sanlam-teal)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex"
      style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      <PMSideNav collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
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
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
          className="p-5 lg:p-8"
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
