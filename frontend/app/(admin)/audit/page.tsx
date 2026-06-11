'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, RefreshCw,
  TrendingUp, User, Settings, Bell, FileText,
  Target, CheckCircle, XCircle, Shield,
} from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext       from '@/components/shared/PageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id:           string;
  action:       string;
  actor:        string;
  actorRole:    string;
  companyId?:   string;
  companyName?: string;
  detail:       string;
  metadata?:    Record<string, any>;
  timestamp:    string;
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  score_calculated:        { label: 'Score calculated',        icon: TrendingUp,  color: '#00B5ED' },
  submission_scored:       { label: 'Submission scored',       icon: TrendingUp,  color: '#00B5ED' },
  submission_received:     { label: 'Submission received',     icon: FileText,    color: '#6366F1' },
  target_set:              { label: 'Target set',              icon: Target,      color: '#00A651' },
  target_deleted:          { label: 'Target deleted',          icon: Target,      color: '#E8A020' },
  user_created:            { label: 'User created',            icon: User,        color: '#00A651' },
  user_approved:           { label: 'User approved',           icon: CheckCircle, color: '#00A651' },
  user_rejected:           { label: 'User rejected',           icon: XCircle,     color: '#D0021B' },
  user_deleted:            { label: 'User deleted',            icon: XCircle,     color: '#D0021B' },
  registration_approved:   { label: 'Registration approved',   icon: CheckCircle, color: '#00A651' },
  registration_rejected:   { label: 'Registration rejected',   icon: XCircle,     color: '#D0021B' },
  ai_context_updated:      { label: 'AI context updated',      icon: Settings,    color: '#E8A020' },
  scoring_config_updated:  { label: 'Scoring config updated',  icon: Settings,    color: '#E8A020' },
  scoring_config_reset:    { label: 'Scoring config reset',    icon: Settings,    color: '#D0021B' },
  notification_sent:       { label: 'Notification sent',       icon: Bell,        color: '#6366F1' },
  company_profile_updated: { label: 'Company profile updated', icon: Shield,      color: '#00B5ED' },
  watchlist_updated:       { label: 'Watchlist updated',       icon: Target,      color: '#00B5ED' },
  engagement_logged:       { label: 'Engagement logged',       icon: FileText,    color: '#00A651' },
};

const ACTION_CATEGORIES: Record<string, string[]> = {
  Scoring:       ['score_calculated', 'submission_scored', 'submission_received', 'scoring_config_updated', 'scoring_config_reset'],
  Targets:       ['target_set', 'target_deleted'],
  Users:         ['user_created', 'user_approved', 'user_rejected', 'user_deleted', 'registration_approved', 'registration_rejected'],
  Configuration: ['ai_context_updated', 'company_profile_updated'],
  Engagement:    ['notification_sent', 'watchlist_updated', 'engagement_logged'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch(path: string) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function groupByDate(entries: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo   = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, AuditEntry[]> = {
    'Today': [], 'Yesterday': [], 'This week': [], 'Older': [],
  };

  for (const e of entries) {
    const d = new Date(e.timestamp);
    if      (d >= today)     groups['Today'].push(e);
    else if (d >= yesterday) groups['Yesterday'].push(e);
    else if (d >= weekAgo)   groups['This week'].push(e);
    else                     groups['Older'].push(e);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, entries]) => ({ label, entries }));
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [entries,        setEntries]        = useState<AuditEntry[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [hasMore,        setHasMore]        = useState(false);
  const [lastTimestamp,  setLastTimestamp]  = useState<string | null>(null);
  const [search,         setSearch]         = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expanded,       setExpanded]       = useState<Set<string>>(new Set());

  const loadEntries = useCallback(async (before?: string) => {
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (before) params.set('before', before);

      const res = await apiFetch(`/api/admin/audit-log?${params}`);
      if (!res) return;
      const json = await res.json();

      setEntries(prev => before ? [...prev, ...json.entries] : json.entries);
      setLastTimestamp(json.lastTimestamp);
      setHasMore(json.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleRefresh = () => {
    setLoading(true);
    setEntries([]);
    setLastTimestamp(null);
    loadEntries();
  };

  const handleLoadMore = () => {
    if (!lastTimestamp || loadingMore) return;
    setLoadingMore(true);
    loadEntries(lastTimestamp);
  };

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // Filter
  const filteredEntries = entries.filter(e => {
    const lc = search.toLowerCase();
    const matchSearch = !search
      || e.detail.toLowerCase().includes(lc)
      || e.actor.toLowerCase().includes(lc)
      || e.action.toLowerCase().includes(lc)
      || (e.companyName || '').toLowerCase().includes(lc);
    const matchCategory = categoryFilter === 'all'
      || (ACTION_CATEGORIES[categoryFilter] || []).includes(e.action);
    return matchSearch && matchCategory;
  });

  const grouped = groupByDate(filteredEntries);

  const handleExport = () => {
    const lines = [
      'Timestamp,Action,Actor,Role,Company,Detail',
      ...filteredEntries.map(e =>
        `"${e.timestamp}","${e.action}","${e.actor}","${e.actorRole}","${e.companyName || ''}","${e.detail.replace(/"/g, '""')}"`
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `INvestScore_AuditLog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <SkeletonCard className="h-12" />
        {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-14" />)}
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {entries.length} events loaded
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg pressable"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <Download size={12} />
          Export CSV
        </button>
      </PageContext>

      {/* Search + category filter */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, actors, companies…"
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', ...Object.keys(ACTION_CATEGORIES)].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-2 rounded-xl text-xs font-medium pressable transition-all"
              style={{
                background: categoryFilter === cat ? 'rgba(0,181,237,0.1)' : 'var(--surface)',
                color:      categoryFilter === cat ? 'var(--sanlam-teal)' : 'var(--text-muted)',
                border:     `1px solid ${categoryFilter === cat ? 'rgba(0,181,237,0.2)' : 'var(--border)'}`,
              }}
            >
              {cat === 'all' ? 'All events' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter result count */}
      {(search || categoryFilter !== 'all') && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {filteredEntries.length} of {entries.length} events
        </p>
      )}

      {/* Grouped entries */}
      {grouped.length === 0 ? (
        <div className="card p-10 text-center" style={{ background: 'var(--surface)' }}>
          <FileText size={24} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search || categoryFilter !== 'all'
              ? 'No events match your filters.'
              : 'No audit events recorded yet. Events appear here as platform actions occur.'}
          </p>
        </div>
      ) : (
        grouped.map(({ label, entries: groupEntries }) => (
          <div key={label}>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </p>

            <div className="card overflow-hidden" style={{ background: 'var(--surface)' }}>
              {groupEntries.map((entry, idx) => {
                const cfg = ACTION_CONFIG[entry.action] || {
                  label: entry.action.replace(/_/g, ' '), icon: FileText, color: '#4A5568',
                };
                const Icon        = cfg.icon;
                const isExp       = expanded.has(entry.id);
                const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
                const time        = new Date(entry.timestamp).toLocaleTimeString('en-ZA', {
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                });

                return (
                  <div
                    key={entry.id}
                    className="animate-card-in"
                    style={{
                      borderBottom:   idx < groupEntries.length - 1 ? '1px solid var(--border)' : 'none',
                      animationDelay: `${Math.min(idx * 15, 300)}ms`,
                    }}
                  >
                    <button
                      onClick={() => hasMetadata && toggleExpand(entry.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100"
                      style={{ cursor: hasMetadata ? 'pointer' : 'default' }}
                      onMouseEnter={e => { if (hasMetadata) (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {/* Icon */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.color}12` }}
                      >
                        <Icon size={13} style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${cfg.color}12`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {entry.companyName && (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {entry.companyName}
                            </span>
                          )}
                          {hasMetadata && (
                            <span
                              className="text-[10px] px-1 py-0.5 rounded"
                              style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                            >
                              {isExp ? '▲ Hide details' : '▼ View details'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                          {entry.detail}
                        </p>
                      </div>

                      {/* Right */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                          {entry.actor === 'system' ? 'System' : entry.actor.split('@')[0]}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {time}
                        </p>
                      </div>
                    </button>

                    {/* Expanded metadata */}
                    {isExp && hasMetadata && (
                      <div
                        className="px-4 pb-3 animate-fade-in"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <pre
                          className="text-[11px] mt-2 p-3 rounded-xl overflow-x-auto"
                          style={{
                            background: 'var(--bg)',
                            color:      'var(--text-muted)',
                            fontFamily: 'monospace',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            wordBreak:  'break-all',
                          }}
                        >
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-xl text-sm font-medium pressable transition-all"
          style={{
            background: 'var(--surface)',
            border:     '1px solid var(--border)',
            color:      'var(--text-muted)',
            opacity:    loadingMore ? 0.7 : 1,
          }}
        >
          {loadingMore ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Loading more…
            </span>
          ) : (
            'Load more events'
          )}
        </button>
      )}

    </div>
  );
}
