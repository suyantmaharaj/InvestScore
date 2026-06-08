'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, ClipboardList,
  MessageSquare, LogOut, TrendingUp, Menu, X,
  ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/scorecard',    label: 'My Scorecard', icon: Target           },
  { href: '/benchmarking', label: 'Benchmarking', icon: Users            },
  { href: '/submit',       label: 'Submit Data',  icon: ClipboardList    },
  { href: '/coach',        label: 'AI Coach',     icon: MessageSquare    },
];

function NavContent({
  onClose,
  collapsed,
}: {
  onClose?:  () => void;
  collapsed?: boolean;
}) {
  const pathname         = usePathname();
  const router           = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div
        style={{
          borderBottom:   '1px solid rgba(255,255,255,0.08)',
          padding:        collapsed ? '1.75rem 0 1.5rem' : '1.75rem 1.5rem 1.5rem',
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {collapsed ? (
          <TrendingUp size={22} style={{ color: '#00B5ED' }} />
        ) : (
          <div className="flex items-center gap-2">
            <TrendingUp size={22} style={{ color: '#00B5ED' }} />
            <div>
              <p className="text-white font-bold text-base leading-tight">InvestScore</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>SME Portal</p>
            </div>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white transition lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className="group flex items-center rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                gap:            collapsed ? 0 : '0.75rem',
                padding:        collapsed ? '0.625rem' : '0.625rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(0,181,237,0.18)' : 'transparent',
                color:      active ? '#00B5ED' : 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLElement).style.color      = 'rgba(255,255,255,0.95)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color      = 'rgba(255,255,255,0.65)';
                }
              }}
            >
              <Icon
                size={18}
                style={{ color: active ? '#00B5ED' : 'rgba(255,255,255,0.65)' }}
                className="flex-shrink-0 transition-colors duration-200 group-hover:text-white"
              />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00B5ED]" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding:   collapsed ? '1rem 0.5rem' : '1rem',
        }}
      >
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className="flex items-center text-sm transition-all duration-200 w-full rounded-lg"
          style={{
            color:          'rgba(255,255,255,0.45)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap:            collapsed ? 0 : '0.5rem',
            padding:        '0.375rem 0.25rem',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLElement).style.color      = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color      = 'rgba(255,255,255,0.45)';
          }}
        >
          <LogOut size={15} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

    </div>
  );
}

export default function SMESideNav({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?:  () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          position:   'fixed',
          top:        0,
          left:       0,
          height:     '100vh',
          zIndex:     30,
          overflow:   'visible',
          background: 'var(--sidebar-bg, #015376)',
          flexShrink: 0,
          width:      collapsed ? '64px' : '240px',
          transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <NavContent collapsed={collapsed} />
        {onToggle && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-[52px] w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition"
            style={{
              background: 'var(--sidebar-bg, #015376)',
              border:     '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}
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
