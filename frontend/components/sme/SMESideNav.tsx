'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Users,
  ClipboardList,
  MessageSquare,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/scorecard',    label: 'My Scorecard', icon: Target           },
  { href: '/benchmarking', label: 'Benchmarking', icon: Users            },
  { href: '/submit',       label: 'Submit Data',  icon: ClipboardList    },
  { href: '/coach',        label: 'AI Coach',     icon: MessageSquare    },
];

export default function SMESideNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <aside className="w-60 min-h-screen bg-[#015376] flex flex-col fixed left-0 top-0 z-30">

      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp size={22} className="text-[#00B5ED]" />
          <div>
            <p className="text-white font-bold text-base leading-tight">INvestScore</p>
            <p className="text-white/40 text-xs">SME Portal</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-[#00B5ED]/20 text-[#00B5ED]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-5 border-t border-white/10">
        <div className="mb-3">
          <p className="text-white text-sm font-medium truncate">{user?.name || 'SME User'}</p>
          <p className="text-white/40 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition w-full"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

    </aside>
  );
}
