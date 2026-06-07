'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Target, Users, ClipboardList,
  MessageSquare, LogOut, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/scorecard',    label: 'My Scorecard', icon: Target           },
  { href: '/benchmarking', label: 'Benchmarking', icon: Users            },
  { href: '/submit',       label: 'Submit Data',  icon: ClipboardList    },
  { href: '/coach',        label: 'AI Coach',     icon: MessageSquare    },
];

interface Props {
  collapsed:    boolean;
  onCollapse:   (v: boolean) => void;
}

export default function SMESideNav({ collapsed, onCollapse }: Props) {
  const pathname         = usePathname();
  const router           = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const width = collapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`${width} min-h-screen bg-[#015376] flex flex-col fixed left-0 top-0 z-30 transition-all duration-200`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 h-[73px] ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
        {collapsed ? (
          <TrendingUp size={22} className="text-[#00B5ED]" />
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <TrendingUp size={22} className="text-[#00B5ED]" />
            <div>
              <p className="text-white font-bold text-base leading-tight">INvestScore</p>
              <p className="text-white/40 text-xs">SME Portal</p>
            </div>
          </div>
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
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                collapsed ? 'justify-center' : ''
              } ${
                active
                  ? 'bg-[#00B5ED]/20 text-[#00B5ED]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-2 py-4 border-t border-white/10">
        {!collapsed && (
          <div className="px-2 mb-3">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'SME User'}</p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center gap-2 text-white/50 text-sm hover:text-white transition w-full px-2 py-1.5 rounded-lg hover:bg-white/5 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={15} />
          {!collapsed && 'Sign out'}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-[#015376] border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
