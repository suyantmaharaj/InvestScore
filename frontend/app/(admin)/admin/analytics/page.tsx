'use client';

import { useState, useEffect } from 'react';
import { SkeletonCard }    from '@/components/shared/Skeleton';
import PageContext          from '@/components/shared/PageContext';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import AnimatedScore       from '@/components/shared/AnimatedScore';
import {
  Users, Building2, FileText, Bell,
  TrendingUp, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';

interface PlatformStats {
  users:         { total: number; sme: number; pm: number; admin: number };
  companies:     { total: number; neverSubmitted: number; overdue90: number; withScorecard: number };
  submissions:   {
    total: number; scored: number; thisQuarter: number;
    thisQuarterScored: number; avgDataCompleteness: number;
    byMonth: { month: string; count: number }[];
  };
  notifications: { last30Days: number };
  recentActivity: { type: string; companyId: string; timestamp: string; detail: string }[];
}

async function apiFetch(path: string) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function StatCard({
  icon: Icon, label, value, sub, color, delay,
}: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; color: string; delay?: string;
}) {
  return (
    <div
      className={`card p-5 animate-card-in ${delay || ''}`}
      style={{ background: 'var(--surface)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}12` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="font-bold text-2xl" style={{ color }}>
        {typeof value === 'number'
          ? <AnimatedScore value={value} decimals={0} raw style={{ color }} />
          : value}
      </p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data }: { data: { month: string; count: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-2" style={{ height: '72px' }}>
      {data.map(({ month, count }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm"
            style={{
              height:     `${Math.max((count / max) * 52, count > 0 ? 4 : 0)}px`,
              background: 'var(--sanlam-teal)',
              opacity:    0.8,
              transition: 'height 700ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
          <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {month.slice(5)}
          </p>
          <p className="text-[9px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {count}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/analytics/platform');
        if (!res) throw new Error('No auth token available');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setStats(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <SkeletonCard className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 text-center" style={{ background: 'var(--surface)' }}>
          <AlertCircle size={24} className="mx-auto mb-3" style={{ color: '#D0021B' }} />
          <p style={{ color: 'var(--text-muted)' }}>{error || 'Failed to load analytics.'}</p>
        </div>
      </div>
    );
  }

  const quarterFunnelPct = stats.companies.total > 0
    ? Math.round((stats.submissions.thisQuarterScored / stats.companies.total) * 100)
    : 0;

  const TYPE_ICON: Record<string, React.ElementType> = {
    submission:             FileText,
    risk_alert:             AlertCircle,
    classification_change:  TrendingUp,
    registration_approved:  CheckCircle,
    submission_reminder:    Bell,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Live platform data · Updated on page load
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#00A651' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00A651' }} />
          Platform operational
        </span>
      </PageContext>

      {/* Hero stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label="Registered users" value={stats.users.total}
          sub={`${stats.users.sme} SME · ${stats.users.pm} PM · ${stats.users.admin} Admin`}
          color="#00B5ED" delay="delay-50"
        />
        <StatCard
          icon={Building2} label="Active companies" value={stats.companies.total}
          sub={`${stats.companies.withScorecard} with scorecard data`}
          color="#00A651" delay="delay-100"
        />
        <StatCard
          icon={FileText} label="Total submissions" value={stats.submissions.scored}
          sub={`${stats.submissions.thisQuarterScored} this quarter`}
          color="#6366F1" delay="delay-150"
        />
        <StatCard
          icon={Bell} label="Notifications sent" value={stats.notifications.last30Days}
          sub="Last 30 days"
          color="#E8A020" delay="delay-200"
        />
      </div>

      {/* Funnel + monthly chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Q2 2026 submission funnel */}
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Q2 2026 Submission Funnel
          </p>
          <div className="space-y-4">
            {[
              { label: 'Registered companies',   value: stats.companies.total,              max: stats.companies.total, color: '#00B5ED' },
              { label: 'Submitted this quarter', value: stats.submissions.thisQuarter,      max: stats.companies.total, color: '#6366F1' },
              { label: 'Scored this quarter',    value: stats.submissions.thisQuarterScored, max: stats.companies.total, color: '#00A651' },
            ].map(({ label, value, max, color }) => {
              const pct = max > 0 ? Math.round((value / max) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-semibold" style={{ color }}>
                      {value} ({pct}%)
                    </span>
                  </div>
                  <AnimatedProgressBar value={pct} color={color} height={8} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Submissions by month */}
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Submissions by Month
          </p>
          {stats.submissions.byMonth.length > 0 ? (
            <MiniBarChart data={stats.submissions.byMonth} />
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet</p>
          )}
        </div>
      </div>

      {/* Data quality + health alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Data completeness */}
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Data Quality
          </p>
          {(() => {
            const pct   = stats.submissions.avgDataCompleteness;
            const color = pct >= 70 ? '#00A651' : pct >= 40 ? '#E8A020' : '#D0021B';
            return (
              <>
                <div className="text-center mb-4">
                  <p className="font-bold text-4xl" style={{ color }}>{pct}%</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Average field completion
                  </p>
                </div>
                <AnimatedProgressBar value={pct} color={color} height={8} />
              </>
            );
          })()}
        </div>

        {/* Platform health alerts */}
        <div className="card p-5 lg:col-span-2" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Platform Health Alerts
          </p>
          <div className="space-y-3">
            {[
              {
                label:    `${stats.companies.neverSubmitted} companies have never submitted`,
                severity: stats.companies.neverSubmitted > 0 ? 'warning' : 'ok',
                Icon:     stats.companies.neverSubmitted > 0 ? AlertCircle : CheckCircle,
              },
              {
                label:    `${stats.companies.overdue90} companies overdue (90+ days)`,
                severity: stats.companies.overdue90 > 0 ? 'warning' : 'ok',
                Icon:     stats.companies.overdue90 > 0 ? Clock : CheckCircle,
              },
              {
                label:    `${quarterFunnelPct}% of companies submitted this quarter`,
                severity: quarterFunnelPct >= 70 ? 'ok' : quarterFunnelPct >= 40 ? 'warning' : 'error',
                Icon:     quarterFunnelPct >= 70 ? CheckCircle : AlertCircle,
              },
              {
                label:    `${stats.submissions.avgDataCompleteness}% average data completeness`,
                severity: stats.submissions.avgDataCompleteness >= 60 ? 'ok' : 'warning',
                Icon:     stats.submissions.avgDataCompleteness >= 60 ? CheckCircle : AlertCircle,
              },
            ].map(({ label, severity, Icon }, i) => {
              const color = severity === 'ok' ? '#00A651' : severity === 'warning' ? '#E8A020' : '#D0021B';
              return (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Icon size={16} style={{ color, flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User breakdown */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          User Breakdown
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { role: 'SME Users',   count: stats.users.sme,   color: '#00B5ED', icon: '🏭' },
            { role: 'PM Users',    count: stats.users.pm,    color: '#00A651', icon: '📊' },
            { role: 'Admin Users', count: stats.users.admin, color: '#6366F1', icon: '⚙️' },
          ].map(({ role, count, color, icon }) => (
            <div
              key={role}
              className="text-center p-4 rounded-xl"
              style={{ background: 'var(--bg)' }}
            >
              <p className="text-2xl mb-1">{icon}</p>
              <p className="font-bold text-2xl" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity timeline */}
      <div className="card" style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Platform Activity
          </p>
        </div>
        {stats.recentActivity.length === 0 ? (
          <p className="px-5 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            No recent activity recorded
          </p>
        ) : (
          stats.recentActivity.map((event, idx) => {
            const Icon    = TYPE_ICON[event.type] || FileText;
            const daysAgo = Math.floor((Date.now() - new Date(event.timestamp).getTime()) / 86400000);
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3 animate-card-in"
                style={{
                  borderBottom:   idx < stats.recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                  animationDelay: `${idx * 25}ms`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,181,237,0.08)' }}
                >
                  <Icon size={13} style={{ color: 'var(--sanlam-teal)' }} />
                </div>
                <p className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>
                  {event.detail}
                </p>
                <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                </p>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
