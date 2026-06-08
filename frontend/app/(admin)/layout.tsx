'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSideNav from '@/components/admin/AdminSideNav';
import PageHeader from '@/components/shared/PageHeader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user)                router.replace('/login');
    if (!loading && user?.role === 'sme') router.replace('/dashboard');
    if (!loading && user?.role === 'pm')  router.replace('/heatmap');
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
      <AdminSideNav />
      <div
        className="flex flex-col lg:ml-60"
        style={{ flex: 1, height: '100vh', overflow: 'hidden', minWidth: 0 }}
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
