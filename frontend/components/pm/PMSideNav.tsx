'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Map,
  GitCompare, Bell, BellDot, LogOut, TrendingUp, Menu, X,
  ChevronLeft, ChevronRight, Users, BarChart2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

const NAV_ITEMS = [
  { href: '/heatmap',       label: 'Portfolio Overview', icon: LayoutDashboard },
  { href: '/employment',    label: 'Employment',          icon: Users           },
  { href: '/completeness',  label: 'Data Completeness',   icon: BarChart2       },
  { href: '/explorer',      label: 'Heat Map',            icon: Map             },
  { href: '/compare',       label: 'Compare',             icon: GitCompare      },
  { href: '/alerts',        label: 'Alerts',              icon: Bell            },
  { href: '/notifications', label: 'Notifications',       icon: BellDot         }
];

function NavContent({
  onClose,
  collapsed,
}: {
  onClose?:  () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout }             = useAuth();
  const { unreadCount }        = useNotifications();

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
          <TrendingUp size={22} style={{ color: 'var(--sanlam-teal)' }} />
        ) : (
          <div className="flex items-center gap-2">
            <TrendingUp size={22} style={{ color: 'var(--sanlam-teal)' }} />
            <div>
              <p className="text-white font-bold text-base leading-tight">InvestScore</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                PM Portal
              </p>
            </div>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white transition lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-2">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,181,237,0.15)', color: 'var(--sanlam-teal)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--sanlam-teal)' }}
            />
            Portfolio Manager
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active    = pathname === href || pathname.startsWith(href + '/');
          const showBadge = href === '/notifications' && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className="relative flex items-center rounded-xl text-sm font-medium"
              style={{
                gap:            collapsed ? 0 : '0.75rem',
                padding:        collapsed ? '0.625rem' : '0.625rem 0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background:     active ? 'var(--sidebar-active-bg)'   : 'transparent',
                color:          active ? 'var(--sidebar-active-text)'  : 'var(--sidebar-text)',
                transition:     'background 150ms cubic-bezier(0.23,1,0.32,1), color 150ms cubic-bezier(0.23,1,0.32,1)',
              }}
            >
              <Icon
                size={18}
                style={{
                  color:      active ? 'var(--sanlam-teal)' : 'var(--sidebar-text)',
                  transition: 'color 150ms',
                }}
              />
              {collapsed && showBadge && (
                <span
                  className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#EF4444' }}
                />
              )}
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {showBadge ? (
                    <span
                      className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                      style={{ background: '#EF4444' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : active ? (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--sanlam-teal)' }}
                    />
                  ) : null}
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
          className="flex items-center text-sm transition-colors w-full rounded-lg hover:bg-white/5"
          style={{
            color:          'rgba(255,255,255,0.45)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap:            collapsed ? 0 : '0.5rem',
            padding:        '0.375rem 0.25rem',
          }}
        >
          <LogOut size={15} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function PMSideNav({
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
          background: 'var(--sidebar-bg)',
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
              background: 'var(--sidebar-bg)',
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
        style={{ background: 'var(--sidebar-bg)', boxShadow: 'var(--shadow-raised)' }}
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
