'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sun, Moon, Bell, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import Tooltip from '@/components/shared/Tooltip';

const PAGE_META: Record<string, {
  title:       string;
  subtitle:    string;
  breadcrumb?: string[];
  icon:        string;
}> = {
  '/dashboard':    {
    icon:       '📊',
    title:      'Dashboard',
    subtitle:   'Your SDG performance at a glance',
    breadcrumb: ['SME Portal', 'Dashboard'],
  },
  '/scorecard':    {
    icon:       '🎯',
    title:      'My Scorecard',
    subtitle:   'Full breakdown across all 17 SDGs',
    breadcrumb: ['SME Portal', 'Scorecard'],
  },
  '/benchmarking': {
    icon:       '📈',
    title:      'Peer Benchmarking',
    subtitle:   'How you compare against sector peers',
    breadcrumb: ['SME Portal', 'Benchmarking'],
  },
  '/submit':       {
    icon:       '📋',
    title:      'Submit SDG Data',
    subtitle:   'Update your KPIs to recalculate your scores',
    breadcrumb: ['SME Portal', 'Submit Data'],
  },
  '/coach':        {
    icon:       '🤖',
    title:      'AI Coach',
    subtitle:   'Personalised advice powered by Claude',
    breadcrumb: ['SME Portal', 'AI Coach'],
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#00B5ED', '#015376', '#00A651', '#6366F1', '#8B5CF6',
    '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  title?:    string;
  subtitle?: string;
  icon?:     string;
  actions?:  React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, actions }: Props) {
  const pathname               = usePathname();
  const router                 = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user }               = useAuth();

  const meta         = PAGE_META[pathname] || PAGE_META['/dashboard'];
  const pageTitle    = title    || meta.title;
  const pageSubtitle = subtitle || meta.subtitle;
  const pageIcon     = icon     || meta.icon;
  const breadcrumb   = meta.breadcrumb || ['SME Portal', meta.title];

  const initials    = getInitials(user?.name || 'User');
  const avatarColor = getAvatarColor(user?.name || 'User');

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-60 z-20 h-16 flex items-center px-5 lg:px-8"
      style={{
        background:           'var(--header-bg, var(--surface))',
        borderBottom:         '1px solid var(--border)',
        boxShadow:            'var(--shadow-card)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Left — icon + title + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0,181,237,0.15) 0%, rgba(1,83,118,0.10) 100%)',
            border:     '1px solid rgba(0,181,237,0.2)',
          }}
        >
          {pageIcon}
        </div>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1 mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight
                    size={11}
                    style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  />
                )}
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: i === breadcrumb.length - 1
                      ? 'var(--sanlam-teal)'
                      : 'var(--text-muted)',
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <div className="flex items-baseline gap-2 min-w-0">
            <h1
              className="font-bold text-base leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {pageTitle}
            </h1>
            <span
              className="text-xs hidden md:block truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {pageSubtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right — actions + theme + notifications + avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {actions && (
          <>
            {actions}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
          </>
        )}

        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: 'var(--bg)',
              border:     '1px solid var(--border)',
              color:      'var(--text-secondary)',
            }}
            aria-label="Toggle theme"
          >
            <div
              className="transition-transform duration-300"
              style={{ transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              {theme === 'dark'
                ? <Sun  size={15} style={{ color: 'var(--sanlam-teal)' }} />
                : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
              }
            </div>
          </button>
        </Tooltip>

        <Tooltip content="Notifications" position="bottom">
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: 'var(--bg)',
              border:     '1px solid var(--border)',
              color:      'var(--text-secondary)',
            }}
            aria-label="Notifications"
          >
            <Bell size={15} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--sanlam-teal)' }}
            />
          </button>
        </Tooltip>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        <Tooltip content={`${user?.name || 'User'} · ${user?.email || ''}`} position="bottom">
          <button
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200"
            style={{
              background: 'var(--bg)',
              border:     '1px solid var(--border)',
            }}
            onClick={() => router.push('/dashboard')}
            aria-label="User profile"
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <span
              className="text-xs font-medium hidden md:block max-w-[100px] truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.name?.split(' ')[0] || 'User'}
            </span>
          </button>
        </Tooltip>

      </div>
    </header>
  );
}
