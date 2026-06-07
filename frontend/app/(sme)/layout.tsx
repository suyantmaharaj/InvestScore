'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SMESideNav from '@/components/sme/SMESideNav';
import { SMEDataProvider } from '@/context/SMEDataContext';

export default function SMELayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="w-8 h-8 border-4 border-[#00B5ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SMEDataProvider>
      <div className="flex min-h-screen bg-[#F4F6F8]">
        <SMESideNav collapsed={collapsed} onCollapse={setCollapsed} />
        <main
          className="flex-1 p-8 min-h-screen transition-all duration-200"
          style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
        >
          {children}
        </main>
      </div>
    </SMEDataProvider>
  );
}
