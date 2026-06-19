'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePMData } from '@/hooks/usePMData';
import { useAttentionScores } from '@/hooks/useAttentionScores';
import { usePortfolioEmployment } from '@/hooks/usePortfolioEmployment';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import { QUADRANT_CONFIG } from '@/lib/attention-score';
import {
  Users, Building2, TrendingUp,
  AlertCircle, ChevronRight, FileText,
} from 'lucide-react';

// ── HERO STAT CARD ────────────────────────────────────────────────────────────
function HeroCard({
  icon: Icon, label, value, sub, color, delay, onClick,
}: {
  icon: React.ElementType; label: string; value: string;
  sub?: string; color: string; delay?: string; onClick?: () => void;
}) {
  return (
    <div
      className={`card p-5 animate-card-in ${delay || ''} ${onClick ? 'cursor-pointer' : ''} transition-all`}
      style={{ background: 'var(--surface)' }}
      onClick={onClick}
      onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--bg)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.background = 'var(--surface)')}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p className="font-bold text-2xl" style={{ color }}>{value}</p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      )}
    </div>
  );
}

export default function PMDashboardPage() {
  const router = useRouter();
  const { portfolio, loading: portfolioLoading } = usePMData();
  const { scores: attentionScores, loading: attentionLoading } = useAttentionScores(portfolio);
  const { employmentData, loading: empLoading } = usePortfolioEmployment(portfolio);

  const [recentActivity, setRecentActivity] = useState<{
    type: string; companyId: string; period: string | null; timestamp: string;
  }[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Wait for portfolio (usePMData's getIdToken refresh) before querying Firestore
  useEffect(() => {
    if (portfolio.length === 0) return;

    const load = async () => {
      try {
        const snaps = await Promise.all(
          portfolio.slice(0, 10).map(({ company }) =>
            getDocs(query(collection(db, 'submissions'), where('companyId', '==', company.id)))
          )
        );

        const activities = snaps
          .flatMap(snap =>
            snap.docs.filter(d => d.data().status === 'scored').map(d => ({
              type:      'submission_scored',
              companyId: d.data().companyId as string,
              period:    d.data().submissionPeriod as string | null,
              timestamp: (d.data().scoredAt ?? d.data().submittedAt ?? '') as string,
            }))
          )
          .filter(a => !!a.timestamp)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 6);

        setRecentActivity(activities);
      } catch {
        // silent — activity feed is non-critical
      } finally {
        setActivityLoading(false);
      }
    };

    load();
  // portfolio.length as scalar dep avoids the array-reference size-change error
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio.length]);

  const stats = useMemo(() => {
    const total     = portfolio.length;
    const withScore = portfolio.filter(({ scorecard }) => !!scorecard);
    const high      = withScore.filter(({ scorecard }) => scorecard!.classification === 'High').length;
    const medium    = withScore.filter(({ scorecard }) => scorecard!.classification === 'Medium').length;
    const low       = withScore.filter(({ scorecard }) => scorecard!.classification === 'Low').length;
    const avgScore  = withScore.length > 0
      ? withScore.reduce((s, { scorecard }) => s + scorecard!.overallScore, 0) / withScore.length
      : 0;
    return { total, scored: withScore.length, high, medium, low, avgScore };
  }, [portfolio]);

  const priorityCompanies = useMemo(() =>
    attentionScores
      .filter(s => s.quadrant === 'priority' || s.quadrant === 'watch')
      .sort((a, b) => b.attentionScore - a.attentionScore)
      .slice(0, 3)
      .map(s => ({
        ...s,
        company:   portfolio.find(({ company }) => company.id === s.companyId)?.company,
        scorecard: portfolio.find(({ company }) => company.id === s.companyId)?.scorecard,
      }))
      .filter(s => !!s.company),
  [attentionScores, portfolio]);

  const loading = portfolioLoading || attentionLoading || empLoading;

  const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  };

  const blackPct   = employmentData.totalEmployees > 0
    ? Math.round((employmentData.blackEmployees  / employmentData.totalEmployees) * 100) : 0;
  const femalePct  = employmentData.totalEmployees > 0
    ? Math.round((employmentData.femaleEmployees / employmentData.totalEmployees) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          104+ SMME Growth &amp; Empowerment Solution
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: '#00A651' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#00A651' }}
          />
          Portfolio active
        </span>
      </PageContext>

      {/* ── HERO STATS ──────────────────────────────────────────────────── */}
      <div data-tour="pm-hero-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroCard
          icon={Building2}
          label="Active companies"
          value={String(stats.total)}
          sub={`${stats.scored} with scorecard data`}
          color="#00B5ED"
          delay="delay-50"
          onClick={() => router.push('/heatmap')}
        />
        <HeroCard
          icon={Users}
          label="Portfolio employees"
          value={employmentData.totalEmployees.toLocaleString()}
          sub={`${blackPct}% Black · ${femalePct}% female`}
          color="#00A651"
          delay="delay-100"
          onClick={() => router.push('/employment')}
        />
        <HeroCard
          icon={TrendingUp}
          label="Average SDG score"
          value={stats.avgScore.toFixed(2)}
          sub={`${stats.high} High · ${stats.medium} Medium · ${stats.low} Low`}
          color={stats.avgScore >= 2.4 ? '#00A651' : stats.avgScore >= 1.6 ? '#E8A020' : '#D0021B'}
          delay="delay-150"
          onClick={() => router.push('/heatmap')}
        />
        <HeroCard
          icon={AlertCircle}
          label="Need attention"
          value={String(priorityCompanies.length)}
          sub="Priority + Watch companies"
          color={priorityCompanies.length > 0 ? '#D0021B' : '#00A651'}
          delay="delay-200"
          onClick={() => router.push('/attention')}
        />
      </div>

      {/* ── PORTFOLIO HEALTH BAR ─────────────────────────────────────────── */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Portfolio Impact Classification
          </p>
          <button
            onClick={() => router.push('/heatmap')}
            className="text-xs font-medium hover:underline flex items-center gap-1"
            style={{ color: 'var(--sanlam-teal)' }}
          >
            View portfolio <ChevronRight size={12} />
          </button>
        </div>

        <div
          className="w-full h-10 rounded-xl overflow-hidden flex mb-3"
          style={{ background: 'var(--border)' }}
        >
          {([
            { count: stats.high,   color: '#00A651', label: 'High'   },
            { count: stats.medium, color: '#E8A020', label: 'Medium' },
            { count: stats.low,    color: '#D0021B', label: 'Low'    },
          ] as const).map(({ count, color, label }) => {
            const pct = stats.scored > 0 ? (count / stats.scored) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={label}
                className="h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                style={{ width: `${pct}%`, background: color, minWidth: '32px' }}
              >
                {count}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          {[
            { label: 'High Impact',   count: stats.high,   color: '#00A651' },
            { label: 'Medium Impact', count: stats.medium, color: '#E8A020' },
            { label: 'Low Impact',    count: stats.low,    color: '#D0021B' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {label}: <strong style={{ color }}>{count}</strong>
              </span>
            </div>
          ))}
          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            {stats.scored} of {stats.total} companies scored
          </span>
        </div>
      </div>

      {/* ── ATTENTION ALERTS + RECENT ACTIVITY ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Attention alerts */}
        <div data-tour="pm-attention-alerts" className="card p-5" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: '#D0021B' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Needs attention
              </p>
            </div>
            <button
              onClick={() => router.push('/attention')}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--sanlam-teal)' }}
            >
              Full view <ChevronRight size={12} />
            </button>
          </div>

          {priorityCompanies.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-sm font-medium" style={{ color: '#00A651' }}>
                All companies on track
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                No Priority or Watch companies right now
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {priorityCompanies.map((item, idx) => {
                if (!item.company) return null;
                const cfg        = QUADRANT_CONFIG[item.quadrant];
                const scoreColor = (item.scorecard?.overallScore ?? 0) >= 2.4 ? '#00A651'
                  : (item.scorecard?.overallScore ?? 0) >= 1.6 ? '#E8A020' : '#D0021B';
                const initials   = item.company.name
                  .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

                return (
                  <button
                    key={item.companyId}
                    onClick={() => router.push(`/company/${item.companyId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all animate-card-in"
                    style={{
                      background:     'var(--bg)',
                      border:         `1px solid ${cfg.color}33`,
                      animationDelay: `${idx * 60}ms`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: cfg.color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.company.name}
                      </p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: scoreColor }}>
                        {item.scorecard?.overallScore.toFixed(1) ?? '—'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Attn: {item.attentionScore}
                      </p>
                    </div>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Recent activity
          </p>

          {activityLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg)' }} />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((event, idx) => {
                const company = portfolio.find(({ company }) => company.id === event.companyId)?.company;
                return (
                  <button
                    key={idx}
                    onClick={() => event.companyId && router.push(`/company/${event.companyId}`)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all animate-card-in"
                    style={{ background: 'var(--bg)', animationDelay: `${idx * 30}ms` }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,181,237,0.1)' }}
                    >
                      <FileText size={13} style={{ color: 'var(--sanlam-teal)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {company?.name ?? event.companyId}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Submission scored · {event.period}
                      </p>
                    </div>
                    <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(event.timestamp)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── PORTFOLIO PULSE (navy) ──────────────────────────────────────── */}
      <div className="card p-5" style={{ background: 'var(--sanlam-navy)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sm text-white">
            104+ Portfolio — Aggregate Impact
          </p>
          <button
            onClick={() => router.push('/employment')}
            className="text-xs font-medium hover:underline flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Full employment data <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: employmentData.totalEmployees.toLocaleString(), unit: 'employees',  label: 'Portfolio jobs',           icon: '👥' },
            { value: `${blackPct}%`,                                 unit: 'Black',       label: 'Workforce transformation', icon: '⚖️'  },
            { value: `${femalePct}%`,                                unit: 'female',      label: 'Gender diversity',         icon: '♀️'  },
            { value: String(stats.total),                            unit: 'companies',   label: 'Active portfolio',         icon: '🏭' },
          ].map(({ value, unit, label, icon }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-lg mb-1">{icon}</p>
              <p className="font-bold text-lg text-white">{value}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{unit}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
