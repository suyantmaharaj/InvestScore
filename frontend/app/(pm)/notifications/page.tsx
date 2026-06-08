'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, RefreshCw, CheckCheck, Building2, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notifications';

type FilterTab = 'all' | 'unread' | NotificationType;

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',                    label: 'All'            },
  { value: 'unread',                 label: 'Unread'         },
  { value: 'risk_alert',             label: 'Risk Alerts'    },
  { value: 'submission',             label: 'Submissions'    },
  { value: 'classification_change',  label: 'Changes'        },
  { value: 'registration_approved',  label: 'Onboarding'     },
];

const TYPE_ICONS: Record<string, string> = {
  submission:            '📋',
  classification_change: '🔄',
  registration_approved: '✅',
  risk_alert:            '🚨',
};

const SEVERITY_BORDER: Record<string, string> = {
  info:     'var(--sanlam-teal)',
  warning:  '#F59E0B',
  critical: '#EF4444',
};

const SEVERITY_BG: Record<string, string> = {
  info:     'rgba(0,181,237,0.06)',
  warning:  'rgba(245,158,11,0.06)',
  critical: 'rgba(239,68,68,0.06)',
};

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const groups: Map<string, Notification[]> = new Map();

  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime())     label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

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

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const [activeTab,  setActiveTab]  = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (activeTab === 'all')    return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) await markRead(n.id);
    if (n.companyId) router.push(`/company/${n.companyId}`);
  };

  return (
    <div className="min-h-screen p-5 lg:p-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              All Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-all duration-150"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--sanlam-teal)' }}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <RefreshCw
                size={15}
                className={refreshing ? 'animate-spin' : ''}
                style={{ color: 'var(--text-muted)' }}
              />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {TABS.map(tab => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150"
                style={{
                  background: active ? 'var(--sanlam-teal)' : 'var(--surface)',
                  color:      active ? '#fff'                : 'var(--text-muted)',
                  border:     `1px solid ${active ? 'var(--sanlam-teal)' : 'var(--border)'}`,
                }}
              >
                {tab.label}
                {tab.value === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-white/25 text-white rounded-full px-1 py-px text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: 'var(--surface)', opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Bell size={32} className="mx-auto mb-3 opacity-25" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No notifications</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'unread' ? 'All caught up!' : 'Nothing here yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </p>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {group.items.map((n, idx) => (
                    <div
                      key={n.id}
                      style={{
                        borderBottom: idx < group.items.length - 1 ? '1px solid var(--border)' : 'none',
                        borderLeft:   `4px solid ${SEVERITY_BORDER[n.severity] || 'var(--sanlam-teal)'}`,
                        background:   n.read ? 'var(--surface)' : SEVERITY_BG[n.severity] || 'var(--surface)',
                      }}
                    >
                      <button
                        onClick={() => handleNotifClick(n)}
                        className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors duration-150"
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'var(--surface)' : (SEVERITY_BG[n.severity] || 'var(--surface)'))}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                        >
                          {TYPE_ICONS[n.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: 'var(--text-primary)', opacity: n.read ? 0.75 : 1 }}
                            >
                              {n.title}
                            </p>
                            <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {n.body}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {n.companyName && (
                              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                <Building2 size={11} />
                                {n.companyName}
                              </span>
                            )}
                            {n.companyId && (
                              <span
                                className="flex items-center gap-1 text-[11px] font-medium"
                                style={{ color: 'var(--sanlam-teal)' }}
                              >
                                View company
                                <ArrowRight size={11} />
                              </span>
                            )}
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
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
