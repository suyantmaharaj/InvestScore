'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Award, AlertTriangle, Building2, ChevronRight,
  Bell, CheckCircle, Clock, AlertCircle, Star,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePMData } from '@/hooks/usePMData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { SDG_LIST, CLASSIFICATION_COLORS } from '@/lib/sdg';
import ScoreSparkline from '@/components/pm/ScoreSparkline';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import Tooltip from '@/components/shared/Tooltip';
import AnimatedScore from '@/components/shared/AnimatedScore';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import PageContext from '@/components/shared/PageContext';
import { toDisplay } from '@/lib/score';

type SortKey   = 'score_desc' | 'score_asc' | 'name' | 'sector';
type FilterKey = 'All' | 'High' | 'Medium' | 'Low';

function scoreColor(score: number) {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

function formatSector(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function MandateBadge({ mandate }: { mandate?: string }) {
  if (!mandate) return null;
  const styles: Record<string, { bg: string; color: string }> = {
    Growth:      { bg: 'rgba(0,181,237,0.12)',  color: '#00B5ED' },
    Empowerment: { bg: 'rgba(0,166,81,0.12)',   color: '#00A651' },
    Development: { bg: 'rgba(232,160,32,0.12)', color: '#E8A020' },
  };
  const s = styles[mandate] || styles.Growth;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {mandate}
    </span>
  );
}

export default function PMPortfolioOverviewPage() {
  const router = useRouter();
  const { portfolio, stats, loading, error } = usePMData();

  const { toggle: toggleWatch, isWatched, watchlist } = useWatchlist();

  const [filter,            setFilter]            = useState<FilterKey>('All');
  const [sort,              setSort]              = useState<SortKey>('score_desc');
  const [search,            setSearch]            = useState('');
  const [mandateFilter,     setMandateFilter]     = useState<string>('All');
  const [bbbeeFilter,       setBbbeeFilter]       = useState<string>('All');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  // Submission tracker state
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, {
    submitted: boolean; submittedAt: string | null; daysAgo: number | null;
  }>>({});
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    if (portfolio.length === 0) return;

    const loadStatus = async () => {
      const quarterStart = new Date();
      quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1);
      quarterStart.setHours(0, 0, 0, 0);

      const statuses: typeof submissionStatus = {};

      await Promise.all(portfolio.map(async ({ company }) => {
        try {
          // No orderBy with where - sort in JS to avoid composite index requirement
          const snap = await getDocs(
            query(
              collection(db, 'submissions'),
              where('companyId', '==', company.id),
              where('status', '==', 'scored'),
            )
          );

          if (snap.empty) {
            statuses[company.id] = { submitted: false, submittedAt: null, daysAgo: null };
            return;
          }

          const sorted = snap.docs
            .map(d => d.data())
            .sort((a, b) =>
              (b.scoredAt ?? b.submittedAt ?? '').localeCompare(a.scoredAt ?? a.submittedAt ?? '')
            );
          const latest   = sorted[0];
          const scoredAt = latest.scoredAt ?? latest.submittedAt;
          const date     = new Date(scoredAt);
          const daysAgo  = Math.floor((Date.now() - date.getTime()) / 86400000);

          statuses[company.id] = {
            submitted:   date >= quarterStart,
            submittedAt: scoredAt,
            daysAgo,
          };
        } catch {
          statuses[company.id] = { submitted: false, submittedAt: null, daysAgo: null };
        }
      }));

      setSubmissionStatus(statuses);
    };

    loadStatus();
  }, [portfolio]);

  const sendReminder = async (companyId: string, companyName: string) => {
    setSendingReminder(companyId);
    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type:       'submission',
          title:      'Quarterly data submission reminder',
          body:       `Your Portfolio Manager has requested your Q2 2026 SDG data submission. Please log in to INvestScore and complete your submission as soon as possible.`,
          companyId,
          companyName,
          severity:   'warning',
          forRole:    'sme',
          metadata:   { source: 'pm_manual_reminder' },
        }),
      });
    } catch (err) {
      console.error('Reminder send error:', err);
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="📋"
        title="Unable to load portfolio"
        description="There was an error loading the portfolio data. Please try again."
      />
    );
  }

  let filtered = portfolio.filter(e => {
    if (showWatchlistOnly && !isWatched(e.company.id)) return false;
    if (filter !== 'All' && e.scorecard?.classification !== filter) return false;
    if (mandateFilter !== 'All' && e.company.mandate !== mandateFilter) return false;
    if (bbbeeFilter !== 'All') {
      const level = e.company.bbbeeLevel;
      if (bbbeeFilter === '1-2' && !(level && level <= 2))             return false;
      if (bbbeeFilter === '3-4' && !(level && level >= 3 && level <= 4)) return false;
      if (bbbeeFilter === '5+'  && !(level && level >= 5))             return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        e.company.name.toLowerCase().includes(q) ||
        e.company.sector.toLowerCase().includes(q) ||
        e.company.industry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'score_desc') return (b.scorecard?.overallScore ?? 0) - (a.scorecard?.overallScore ?? 0);
    if (sort === 'score_asc')  return (a.scorecard?.overallScore ?? 0) - (b.scorecard?.overallScore ?? 0);
    if (sort === 'name')       return a.company.name.localeCompare(b.company.name);
    if (sort === 'sector')     return a.company.sector.localeCompare(b.company.sector);
    return 0;
  });

  const avg = stats.avgScore;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Portfolio: <strong style={{ color: 'var(--text-primary)' }}>
            {stats.total} active companies
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Period: <strong style={{ color: 'var(--text-primary)' }}>Q1 2026</strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--sanlam-green)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--sanlam-green)' }} />
          Live scores
        </span>
        {mandateFilter !== 'All' && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
            >
              {mandateFilter} mandate
            </span>
          </>
        )}
        {bbbeeFilter !== 'All' && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(212,175,55,0.15)', color: '#B8860B' }}
            >
              B-BBEE {bbbeeFilter}
            </span>
          </>
        )}
      </PageContext>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Building2,    iconColor: '#00B5ED',
            value: String(stats.total),
            label: 'Total Companies',
            sub: 'Active investments',        subColor: '#00B5ED',
            delay: 'delay-50',
          },
          {
            icon: TrendingUp,   iconColor: '#00A651',
            value: String(stats.highCount),
            label: 'High Impact',
            sub: 'Performing above target',   subColor: '#00A651',
            delay: 'delay-100',
          },
          {
            icon: AlertTriangle, iconColor: '#E8A020',
            value: String(stats.lowCount),
            label: 'Need Attention',
            sub: 'Below sector average',      subColor: '#E8A020',
            delay: 'delay-150',
          },
          {
            icon: Award,        iconColor: '#00B5ED',
            value: avg.toFixed(2),
            label: 'Portfolio Average',
            sub: 'Overall SDG score / 100',   subColor: scoreColor(avg),
            delay: 'delay-200',
            isScore: true,
          },
        ].map(({ icon: Icon, iconColor, value, label, sub, subColor, delay, isScore }) => (
          <div
            key={label}
            className={`card p-5 animate-card-in ${delay}`}
            style={{ background: 'var(--surface)' }}
          >
            <Icon size={20} style={{ color: iconColor }} className="mb-3" />
            {isScore ? (
              <AnimatedScore
                value={parseFloat(value)}
                className="font-bold text-xl block mb-0.5"
                style={{ color: subColor }}
              />
            ) : (
              <p className="font-bold text-xl mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Stacked progress bar */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Portfolio SDG Score Distribution
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[
              { label: `High (${stats.highCount})`,   color: '#00A651' },
              { label: `Medium (${stats.mediumCount})`, color: '#E8A020' },
              { label: `Low (${stats.lowCount})`,     color: '#D0021B' },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden flex"
          style={{ background: 'var(--border)' }}
        >
          {stats.total > 0 && (
            <>
              <div style={{ width: `${(stats.highCount / stats.total) * 100}%`,   background: '#00A651', transition: 'width 800ms cubic-bezier(0.16,1,0.3,1)' }} />
              <div style={{ width: `${(stats.mediumCount / stats.total) * 100}%`, background: '#E8A020', transition: 'width 800ms cubic-bezier(0.16,1,0.3,1) 100ms' }} />
              <div style={{ width: `${(stats.lowCount / stats.total) * 100}%`,    background: '#D0021B', transition: 'width 800ms cubic-bezier(0.16,1,0.3,1) 200ms' }} />
            </>
          )}
        </div>
      </div>

      {/* Submission tracker */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Q2 2026 Submission Status
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {Object.values(submissionStatus).filter(s => s.submitted).length} of {portfolio.length} companies submitted this quarter
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {[
              { Icon: CheckCircle, label: 'Submitted',      color: '#00A651' },
              { Icon: Clock,       label: 'Overdue',         color: '#E8A020' },
              { Icon: AlertCircle, label: 'Never submitted', color: '#D0021B' },
            ].map(({ Icon, label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={12} style={{ color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {portfolio.map(({ company }, idx) => {
            const status       = submissionStatus[company.id];
            const submitted    = status?.submitted;
            const neverSubmitted = status && !status.submittedAt;
            const StatusIcon   = submitted ? CheckCircle : neverSubmitted ? AlertCircle : Clock;
            const iconColor    = submitted ? '#00A651'   : neverSubmitted ? '#D0021B'   : '#E8A020';
            const borderColor  = submitted ? '#00A651'   : neverSubmitted ? '#D0021B'   : '#E8A020';

            return (
              <div
                key={company.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl animate-card-in"
                style={{ background: 'var(--bg)', border: `1px solid ${borderColor}22`, animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <StatusIcon size={14} style={{ color: iconColor, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {company.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {submitted
                        ? `${status.daysAgo}d ago`
                        : status?.submittedAt
                          ? `Last: ${status.daysAgo}d ago`
                          : 'Never submitted'}
                    </p>
                  </div>
                </div>
                {!submitted && (
                  <button
                    onClick={() => sendReminder(company.id, company.name)}
                    disabled={sendingReminder === company.id}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0 pressable"
                    style={{
                      background: sendingReminder === company.id ? 'var(--border)' : 'rgba(232,160,32,0.12)',
                      color:      sendingReminder === company.id ? 'var(--text-muted)' : '#E8A020',
                      opacity:    sendingReminder === company.id ? 0.6 : 1,
                    }}
                  >
                    <Bell size={10} />
                    {sendingReminder === company.id ? '...' : 'Chase'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter / search / sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowWatchlistOnly(s => !s)}
          className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold pressable"
          style={{
            background:  showWatchlistOnly ? 'rgba(212,175,55,0.15)' : 'var(--surface)',
            color:       showWatchlistOnly ? '#B8860B'                : 'var(--text-muted)',
            border:      `1.5px solid ${showWatchlistOnly ? '#B8860B' : 'var(--border)'}`,
            transition:  'all 150ms var(--ease-out)',
          }}
        >
          <Star size={12} fill={showWatchlistOnly ? '#B8860B' : 'none'} />
          Watchlist
          {showWatchlistOnly && watchlist.length > 0 && (
            <span className="ml-0.5">({watchlist.length})</span>
          )}
        </button>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies, sectors..."
          className="h-9 px-3 rounded-xl text-sm flex-1 min-w-[180px] max-w-xs focus:outline-none"
          style={{
            background: 'var(--surface)',
            border:     '1.5px solid var(--border)',
            color:      'var(--text-primary)',
          }}
        />

        <div className="flex gap-1">
          {(['All', 'High', 'Medium', 'Low'] as FilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs rounded-lg border font-medium pressable"
              style={{
                background:  filter === f ? 'var(--sanlam-teal)' : 'var(--surface)',
                color:       filter === f ? 'white'               : 'var(--text-muted)',
                borderColor: filter === f ? 'var(--sanlam-teal)' : 'var(--border)',
                transition:  'background 150ms var(--ease-out), color 150ms var(--ease-out), border-color 150ms var(--ease-out)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Mandate filter */}
        <div className="flex gap-1">
          {['All', 'Growth', 'Empowerment', 'Development'].map(m => (
            <button
              key={m}
              onClick={() => setMandateFilter(m)}
              className="px-2.5 py-1.5 text-xs rounded-lg border font-medium pressable"
              style={{
                background:  mandateFilter === m ? 'var(--sanlam-navy)' : 'var(--surface)',
                color:       mandateFilter === m ? 'white'               : 'var(--text-muted)',
                borderColor: mandateFilter === m ? 'var(--sanlam-navy)' : 'var(--border)',
                transition:  'background 150ms var(--ease-out), color 150ms var(--ease-out), border-color 150ms var(--ease-out)',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* B-BBEE level filter */}
        <div className="flex gap-1">
          {[
            { key: 'All', label: 'All B-BBEE' },
            { key: '1-2', label: 'L1–2 ★'    },
            { key: '3-4', label: 'L3–4'       },
            { key: '5+',  label: 'L5+'        },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setBbbeeFilter(key)}
              className="px-2.5 py-1.5 text-xs rounded-lg border font-medium pressable"
              style={{
                background:  bbbeeFilter === key ? 'rgba(212,175,55,0.2)' : 'var(--surface)',
                color:       bbbeeFilter === key ? '#B8860B'               : 'var(--text-muted)',
                borderColor: bbbeeFilter === key ? '#B8860B'               : 'var(--border)',
                transition:  'background 150ms var(--ease-out), color 150ms var(--ease-out), border-color 150ms var(--ease-out)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="h-9 px-3 text-xs rounded-xl focus:outline-none"
          style={{
            background: 'var(--surface)',
            border:     '1.5px solid var(--border)',
            color:      'var(--text-primary)',
          }}
        >
          <option value="score_desc">Score: High to Low</option>
          <option value="score_asc">Score: Low to High</option>
          <option value="name">Name A–Z</option>
          <option value="sector">Sector</option>
        </select>

        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} of {portfolio.length} companies
        </span>
      </div>

      {/* Company list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No companies match"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ company, scorecard }, idx) => {
            const cc      = scorecard ? CLASSIFICATION_COLORS[scorecard.classification] : null;
            const topSDGs = scorecard?.sdgScores
              .slice()
              .sort((a, b) => b.score - a.score)
              .slice(0, 5) ?? [];

            return (
              <div
                key={company.id}
                onClick={() => router.push(`/company/${company.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && router.push(`/company/${company.id}`)}
                className="card card-interactive w-full text-left p-4 animate-card-in"
                style={{ background: 'var(--surface)', animationDelay: `${idx * 40}ms`, cursor: 'pointer' }}
              >
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--sanlam-navy)' }}
                  >
                    {company.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {company.name}
                      </p>
                      <MandateBadge mandate={company.mandate} />
                      {company.bbbeeLevel && (
                        <Tooltip content={`B-BBEE Level ${company.bbbeeLevel}`} position="top">
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
                          >
                            L{company.bbbeeLevel}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatSector(company.sector)} · {company.location}
                    </p>

                    {/* SDG mini strip */}
                    <div className="flex gap-1 mt-2">
                      {topSDGs.map(s => {
                        const sdg = SDG_LIST.find(d => d.id === s.sdgId);
                        return (
                          <Tooltip key={s.sdgId} content={`SDG ${s.sdgId}: ${toDisplay(s.score)}`} position="top">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                              style={{
                                background: `${sdg?.color}20`,
                                color:       sdg?.color,
                                border:      `1px solid ${sdg?.color}30`,
                              }}
                            >
                              {s.sdgId}
                            </div>
                          </Tooltip>
                        );
                      })}
                      {(scorecard?.sdgScores.length ?? 0) > 5 && (
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-medium"
                          style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          +{(scorecard?.sdgScores.length ?? 0) - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score + sparkline */}
                  <div className="text-right flex-shrink-0 ml-4">
                    {scorecard ? (
                      <>
                        <div className="flex items-end gap-1 justify-end mb-1">
                          <span
                            className="font-bold text-xl leading-none"
                            style={{ color: scoreColor(scorecard.overallScore) }}
                          >
                            {toDisplay(scorecard.overallScore)}
                          </span>
                          <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
                        </div>
                        {cc && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
                          >
                            {scorecard.classification}
                          </span>
                        )}
                        <div className="mt-2 w-20">
                          <AnimatedProgressBar
                            value={((scorecard.overallScore - 1) / 2) * 100}
                            color={scoreColor(scorecard.overallScore)}
                            height={4}
                            delay={idx * 40 + 200}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <ScoreSparkline companyId={company.id} />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No data</span>
                    )}
                  </div>

                  {/* Star + chevron */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleWatch(company.id); }}
                      className="p-1.5 rounded-lg pressable"
                      style={{
                        color:       isWatched(company.id) ? '#B8860B' : 'var(--text-muted)',
                        background:  isWatched(company.id) ? 'rgba(212,175,55,0.15)' : 'transparent',
                        transition:  'all 150ms var(--ease-out)',
                      }}
                    >
                      <Star size={14} fill={isWatched(company.id) ? '#B8860B' : 'none'} />
                    </button>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
