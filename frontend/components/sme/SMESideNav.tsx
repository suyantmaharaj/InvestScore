'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, ClipboardList,
  MessageSquare, LogOut, TrendingUp, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/scorecard',    label: 'My Scorecard', icon: Target           },
  { href: '/benchmarking', label: 'Benchmarking', icon: Users            },
  { href: '/submit',       label: 'Submit Data',  icon: ClipboardList    },
  { href: '/coach',        label: 'AI Coach',     icon: MessageSquare    },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname         = usePathname();
  const router           = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-6 pt-7 pb-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={22} style={{ color: '#00B5ED' }} />
          <div>
            <p className="text-white font-bold text-base leading-tight">InvestScore</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>SME Portal</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--sidebar-active-bg, rgba(0,181,237,0.15))' : 'transparent',
                color:      active ? 'var(--sidebar-active-text, #00B5ED)'             : 'var(--sidebar-text, rgba(255,255,255,0.65))',
              }}
            >
              <Icon
                size={18}
                style={{ color: active ? '#00B5ED' : 'var(--sidebar-text, rgba(255,255,255,0.65))' }}
                className="flex-shrink-0"
              />
              <span>{label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00B5ED]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm transition-colors w-full px-1 py-1.5 rounded-lg hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function SMESideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="w-60 hidden lg:flex flex-col"
        style={{
          position:   'fixed',
          top:        0,
          left:       0,
          height:     '100vh',
          zIndex:     30,
          overflowY:  'auto',
          overflowX:  'hidden',
          background: 'var(--sidebar-bg, #015376)',
          flexShrink: 0,
        }}
      >
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--sidebar-bg, #015376)', boxShadow: 'var(--shadow-raised)' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} className="text-white" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
            style={{
              background: 'var(--sidebar-bg, #015376)',
              animation:  'slideInLeft 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
