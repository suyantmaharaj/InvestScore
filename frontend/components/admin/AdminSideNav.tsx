'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, UserPlus,
  Brain, LogOut, TrendingUp, Menu, X, Shield, BarChart2, Sliders,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/admin/dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/analytics',     label: 'Analytics',       icon: BarChart2       },
  { href: '/admin/scoring',       label: 'Scoring Config',  icon: Sliders         },
  { href: '/admin/users',         label: 'User Management', icon: Users           },
  { href: '/admin/registrations', label: 'Registrations',   icon: UserPlus        },
  { href: '/admin/ai-context',    label: 'AI Context',      icon: Brain           },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
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
          <TrendingUp size={22} style={{ color: 'var(--sanlam-teal)' }} />
          <div>
            <p className="text-white font-bold text-base leading-tight">InvestScore</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Admin Portal
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white transition lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-5 pt-4 pb-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(208,2,27,0.15)', color: '#FC8181' }}
        >
          <Shield size={10} />
          Sanlam Administrator
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: active ? 'var(--sidebar-active-bg)'  : 'transparent',
                color:      active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              }}
            >
              <Icon
                size={18}
                style={{
                  color:      active ? 'var(--sanlam-teal)' : 'var(--sidebar-text)',
                  transition: 'color 150ms',
                }}
              />
              <span>{label}</span>
              {active && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--sanlam-teal)' }}
                />
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
        <div className="mb-3 px-1">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {user?.email}
          </p>
        </div>
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

export default function AdminSideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
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
          background: 'var(--sidebar-bg)',
          flexShrink: 0,
        }}
      >
        <NavContent />
      </aside>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--sidebar-bg)' }}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} className="text-white" />
      </button>

      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
            style={{
              background: 'var(--sidebar-bg)',
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
