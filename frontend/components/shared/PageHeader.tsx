'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun, Moon, Bell, ChevronRight,
  Settings, LogOut, ChevronDown, Map,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import Tooltip from '@/components/shared/Tooltip';
import { useTour } from '@/contexts/TourContext';
import {
  SME_TOUR_START, SME_TOUR_END,
  PM_TOUR_START,  PM_TOUR_END,
  ADMIN_TOUR_START, ADMIN_TOUR_END,
  TOUR_CREDENTIALS,
} from '@/lib/tour';

function formatTimeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const PAGE_META: Record<string, { title: string; subtitle: string; breadcrumb?: string[]; icon: string }> = {
  '/dashboard':    { icon: '📊', title: 'Dashboard',       subtitle: '', breadcrumb: ['SME Portal', 'Dashboard']    },
  '/scorecard':    { icon: '🎯', title: 'My Scorecard',    subtitle: '', breadcrumb: ['SME Portal', 'Scorecard']     },
  '/benchmarking': { icon: '📈', title: 'Peer Benchmarking', subtitle: '', breadcrumb: ['SME Portal', 'Benchmarking'] },
  '/submit':       { icon: '📋', title: 'Submit SDG Data', subtitle: '', breadcrumb: ['SME Portal', 'Submit Data']   },
  '/coach':        { icon: '💬', title: 'Chase',           subtitle: '', breadcrumb: ['SME Portal', 'Chase']         },
  '/settings':     { icon: '⚙️', title: 'Settings',        subtitle: 'Manage your profile and preferences',             breadcrumb: ['SME Portal', 'Settings']    },
  '/history':      { icon: '📅', title: 'Submission History', subtitle: '',                                                    breadcrumb: ['SME Portal', 'History']     },
  '/learning':     { icon: '📖', title: 'Learning Centre',    subtitle: 'Master SDGs, KPIs, and impact reporting',          breadcrumb: ['SME Portal', 'Learn']       },
  '/profile':      { icon: '🏢', title: 'Company Profile',    subtitle: '',                                                   breadcrumb: ['SME Portal', 'Company Profile'] },

  // PM Portal pages
  '/pm-dashboard': { icon: '📊', title: 'Portfolio Dashboard', subtitle: '104+ SMME Growth & Empowerment Solution — portfolio overview', breadcrumb: ['PM Portal', 'Dashboard'] },
  '/heatmap':       { icon: '📋', title: 'Portfolio Overview',  subtitle: '',                                                   breadcrumb: ['PM Portal', 'Portfolio Overview'] },
  '/explorer':      { icon: '🗺️', title: 'SDG Heat Map',        subtitle: '',                                                   breadcrumb: ['PM Portal', 'Heat Map']           },
  '/compare':       { icon: '⚖️', title: 'Compare Companies',    subtitle: 'Side-by-side SDG performance across up to 4 companies', breadcrumb: ['PM Portal', 'Compare']       },
  '/alerts':        { icon: '🔔', title: 'Alerts',              subtitle: '',                                                   breadcrumb: ['PM Portal', 'Alerts']            },
  '/company':       { icon: '🏢', title: 'Company Detail',      subtitle: 'Full scorecard and investment narrative',            breadcrumb: ['PM Portal', 'Company Detail']    },
  '/notifications':  { icon: '🔔', title: 'Notifications',        subtitle: '',                                                              breadcrumb: ['PM Portal', 'Notifications']       },
  '/pm/settings':    { icon: '⚙️', title: 'Settings',             subtitle: 'Manage your profile and preferences',                         breadcrumb: ['PM Portal', 'Settings']           },
  '/employment':     { icon: '👥', title: 'Portfolio Employment',  subtitle: '',                                                              breadcrumb: ['PM Portal', 'Employment']          },
  '/completeness':   { icon: '📊', title: 'Data Completeness',     subtitle: '',                                                            breadcrumb: ['PM Portal', 'Data Completeness']  },
  '/attention':      { icon: '🎯', title: 'Attention Score',       subtitle: '',                                                            breadcrumb: ['PM Portal', 'Attention Score']     },
  '/trends':         { icon: '📈', title: 'Score Trends',          subtitle: '',                                                            breadcrumb: ['PM Portal', 'Score Trends']        },

  // Admin Portal pages
  '/admin/dashboard':     { icon: '🛡️', title: 'Admin Dashboard',       subtitle: '', breadcrumb: ['Admin Portal', 'Dashboard']     },
  '/admin/analytics':     { icon: '📈', title: 'Platform Analytics',    subtitle: '', breadcrumb: ['Admin Portal', 'Analytics']     },
  '/admin/users':         { icon: '👥', title: 'User Management',       subtitle: '', breadcrumb: ['Admin Portal', 'Users']         },
  '/admin/registrations': { icon: '📝', title: 'Registrations',         subtitle: '', breadcrumb: ['Admin Portal', 'Registrations'] },
  '/admin/ai-context':    { icon: '🧠', title: 'AI Context Editor',     subtitle: '', breadcrumb: ['Admin Portal', 'AI Context']    },
  '/admin/scoring':       { icon: '⚙️', title: 'Scoring Methodology',  subtitle: '', breadcrumb: ['Admin Portal', 'Scoring Config'] },
  '/audit':               { icon: '📋', title: 'Audit Log',             subtitle: '', breadcrumb: ['Admin Portal', 'Audit Log']      },
  '/companies/new':       { icon: '🏭', title: 'Add Company',           subtitle: '', breadcrumb: ['Admin', 'Companies', 'New']      },
  '/companies':           { icon: '🏭', title: 'Company Management',    subtitle: '', breadcrumb: ['Admin', 'Companies']             },
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
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
  actions?: React.ReactNode;
}

const NOTIF_ICONS: Record<string, string> = {
  submission:             '📋',
  classification_change:  '🔄',
  registration_approved:  '✅',
  risk_alert:             '🚨',
};

const SEVERITY_COLORS: Record<string, string> = {
  info:     'var(--sanlam-teal)',
  warning:  '#F59E0B',
  critical: '#EF4444',
};

export default function PageHeader({ actions }: Props) {
  const pathname               = usePathname();
  const router                 = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout }       = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const { active: tourActive, startTour } = useTour();

  const handleTour = useCallback(() => {
    if (user?.role === 'pm') {
      startTour({ startStep: PM_TOUR_START, endStep: PM_TOUR_END, ...TOUR_CREDENTIALS.pm });
    } else if (user?.role === 'admin') {
      startTour({ startStep: ADMIN_TOUR_START, endStep: ADMIN_TOUR_END, ...TOUR_CREDENTIALS.admin });
    } else {
      startTour({ startStep: SME_TOUR_START, endStep: SME_TOUR_END, ...TOUR_CREDENTIALS.sme });
    }
  }, [user, startTour]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const isPM    = user?.role === 'pm';
  const meta    = PAGE_META[pathname] ?? Object.entries(PAGE_META).find(([k]) => pathname.startsWith(k))?.[1] ?? PAGE_META['/dashboard'];
  const initials    = getInitials(user?.name || 'User');
  const avatarColor = getAvatarColor(user?.name || 'User');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    if (bellOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDropdownOpen(false); setBellOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    router.replace('/login');
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    router.push(isPM ? '/pm/settings' : '/settings');
  };

  return (
    <header
      className="h-16 flex items-center px-5 lg:px-8 flex-shrink-0"
      style={{
        position:             'sticky',
        top:                  0,
        zIndex:               20,
        background:           'var(--header-bg, var(--surface))',
        borderBottom:         '1px solid var(--border)',
        boxShadow:            'var(--shadow-card)',
        backdropFilter:       'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Left - icon + breadcrumb + title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0,181,237,0.15) 0%, rgba(1,83,118,0.10) 100%)',
            border:     '1px solid rgba(0,181,237,0.2)',
          }}
        >
          {meta.icon}
        </div>

        <div className="min-w-0">
          <div className="hidden sm:flex items-center gap-1 mb-0.5">
            {(meta.breadcrumb || ['SME Portal', meta.title]).map((crumb, i, arr) => (
              <span key={crumb} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                <span
                  className="text-[11px] font-medium"
                  style={{ color: i === arr.length - 1 ? 'var(--sanlam-teal)' : 'var(--text-muted)' }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="font-bold text-base leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              {meta.title}
            </h1>
            {meta.subtitle && (
              <span className="text-xs hidden md:block truncate" style={{ color: 'var(--text-muted)' }}>
                {meta.subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right - actions + theme + bell + user dropdown */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {actions && (
          <>
            {actions}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
          </>
        )}

        {/* Tour button */}
        {!tourActive && (
          <Tooltip content="Take a guided tour of this portal" position="bottom">
            <button
              onClick={handleTour}
              className="flex items-center gap-1.5 rounded-xl px-3 h-9 text-xs font-semibold transition-all duration-200"
              style={{
                background: 'rgba(0,181,237,0.08)',
                color:      'var(--sanlam-teal)',
                border:     '1px solid rgba(0,181,237,0.2)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,181,237,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,181,237,0.08)')}
            >
              <Map size={13} />
              <span className="hidden sm:inline">Tour</span>
            </button>
          </Tooltip>
        )}

        {/* Theme toggle */}
        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} position="bottom">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark'
              ? <Sun  size={15} style={{ color: 'var(--sanlam-teal)' }} />
              : <Moon size={15} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>
        </Tooltip>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(prev => !prev)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: bellOpen ? 'var(--surface-raised)' : 'var(--bg)',
              border:     `1px solid ${bellOpen ? 'var(--sanlam-teal)' : 'var(--border)'}`,
            }}
            aria-label="Notifications"
          >
            <Bell size={15} style={{ color: 'var(--text-secondary)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
                style={{ background: '#EF4444', lineHeight: 1 }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden animate-card-in"
              style={{
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
                boxShadow:  'var(--shadow-float)',
                zIndex:     50,
              }}
            >
              {/* Bell header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Bell size={13} style={{ color: 'var(--sanlam-teal)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: '#EF4444' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--sanlam-teal)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.companyId) { setBellOpen(false); router.push(`/company/${n.companyId}`); }
                      }}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150"
                      style={{
                        background:   n.read ? 'transparent' : 'rgba(0,181,237,0.04)',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0,181,237,0.04)')}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                      >
                        {NOTIF_ICONS[n.type] || '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.body}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: SEVERITY_COLORS[n.severity] || 'var(--sanlam-teal)' }}
                          />
                          <span className="text-[10px]" style={{ color: SEVERITY_COLORS[n.severity] || 'var(--sanlam-teal)' }}>
                            {n.severity.charAt(0).toUpperCase() + n.severity.slice(1)}
                          </span>
                          {!n.read && (
                            <span
                              className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,181,237,0.12)', color: 'var(--sanlam-teal)' }}
                            >
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Bell footer */}
              {isPM && (
                <div
                  className="px-4 py-2.5"
                  style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  <button
                    onClick={() => { setBellOpen(false); router.push('/notifications'); }}
                    className="w-full text-center text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--sanlam-teal)' }}
                  >
                    See all notifications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* User avatar chip - click opens dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200"
            style={{
              background: dropdownOpen ? 'var(--surface-raised)' : 'var(--bg)',
              border:     `1px solid ${dropdownOpen ? 'var(--sanlam-teal)' : 'var(--border)'}`,
              boxShadow:  dropdownOpen ? '0 0 0 3px rgba(0,181,237,0.12)' : 'none',
            }}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            <span
              className="text-xs font-medium hidden md:block max-w-[90px] truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown
              size={13}
              className="hidden md:block transition-transform duration-200"
              style={{
                color:     'var(--text-muted)',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden animate-card-in"
              style={{
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
                boxShadow:  'var(--shadow-float)',
                zIndex:     50,
              }}
            >
              {/* User info header */}
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                    <span
                      className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,181,237,0.12)', color: 'var(--sanlam-teal)' }}
                    >
                      SME User
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="px-2 py-2">
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,181,237,0.1)' }}
                  >
                    <Settings size={14} style={{ color: 'var(--sanlam-teal)' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Settings</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Profile, appearance, preferences</p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>

                <div className="my-1.5 mx-1" style={{ height: '1px', background: 'var(--border)' }} />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(208,2,27,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(208,2,27,0.08)' }}
                  >
                    <LogOut size={14} style={{ color: 'var(--sanlam-red)' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: 'var(--sanlam-red)' }}>Sign out</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>End your current session</p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div
                className="px-4 py-2.5"
                style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                  InvestScore · Sanlam Investments · 2026
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
