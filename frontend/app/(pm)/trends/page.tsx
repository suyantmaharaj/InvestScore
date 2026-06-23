'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Minus,
  ChevronRight, ChevronUp, ChevronDown,
  Search,
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePMData, PMScorecard } from '@/hooks/usePMData';
import { CLASSIFICATION_COLORS } from '@/lib/sdg';
import { SkeletonCard } from '@/components/shared/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendEntry {
  companyId:      string;
  companyName:    string;
  sector:         string;
  currentScore:   number;
  prevScore:      number;
  delta:          number;
  direction:      'improving' | 'declining' | 'stable';
  velocity:       number;
  history:        number[];
  classification: 'Low' | 'Medium' | 'High';
}

type SortKey       = 'delta' | 'score' | 'velocity' | 'name';
type SortDir       = 'asc' | 'desc';
type DirFilter     = 'All' | 'improving' | 'declining' | 'stable';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function MiniSparkline({
  data,
  color,
  width = 72,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2}
          stroke={color} strokeWidth={1.5} opacity={0.25} />
      </svg>
    );
  }
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = Math.max(max - min, 1);
  const pts   = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path d={area} fill={color} opacity={0.12} />
      <polyline points={pts.join(' ')} fill="none" stroke={color}
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={2.5} fill={color} />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dirColor(d: TrendEntry['direction']) {
  return d === 'improving' ? '#00A651' : d === 'declining' ? '#EF4444' : 'var(--text-muted)';
}

function sparkColor(d: TrendEntry['direction']) {
  return d === 'improving' ? '#00A651' : d === 'declining' ? '#EF4444' : '#6366F1';
}

function avatarColor(name: string) {
  const palette = ['#00B5ED', '#00A651', '#F59E0B', '#6366F1', '#EC4899', '#EF4444', '#8B5CF6', '#10B981'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function ini(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Sort header ─────────────────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide select-none ${className}`}
      style={{ color: active ? 'var(--sanlam-teal)' : 'var(--text-muted)' }}
    >
      {label}
      <span className="ml-0.5">
        {active
          ? dir === 'desc'
            ? <ChevronDown size={11} />
            : <ChevronUp size={11} />
          : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
      </span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const router  = useRouter();
  const { portfolio, loading: pmLoading } = usePMData();

  const [trends,    setTrends]    = useState<TrendEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sortKey,   setSortKey]   = useState<SortKey>('delta');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [dirFilter, setDirFilter] = useState<DirFilter>('All');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (pmLoading)              return;
    if (portfolio.length === 0) { setLoading(false); return; }

    const load = async () => {
      try {
        setLoading(true);
        const entries = await Promise.all(
          portfolio.map(async ({ company, scorecard }) => {
            const snap   = await getDocs(
              query(collection(db, 'scorecards'), where('companyId', '==', company.id))
            );
            const sorted = snap.docs
              .map(d => d.data() as PMScorecard)
              .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt))
              .slice(-8);

            const history  = sorted.map(s => s.overallScore);
            const current  = history[history.length - 1] ?? scorecard?.overallScore ?? 0;
            const prev     = history.length >= 2 ? history[history.length - 2] : current;
            const delta    = current - prev;
            const velocity = history.length >= 2
              ? history.slice(1).reduce((sum, v, i) => sum + (v - history[i]), 0) / (history.length - 1)
              : 0;

            return {
              companyId:      company.id,
              companyName:    company.name,
              sector:         company.sector,
              currentScore:   current,
              prevScore:      prev,
              delta,
              direction:      delta > 0.1 ? 'improving' : delta < -0.1 ? 'declining' : 'stable',
              velocity,
              history,
              classification: scorecard?.classification ?? 'Low',
            } satisfies TrendEntry;
          })
        );
        setTrends(entries);
      } catch (err) {
        console.error('TrendsPage load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolio, pmLoading]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  // Aggregates
  const improving = trends.filter(t => t.direction === 'improving').length;
  const declining  = trends.filter(t => t.direction === 'declining').length;
  const stable     = trends.filter(t => t.direction === 'stable').length;
  const avgDelta   = trends.length > 0
    ? trends.reduce((s, t) => s + t.delta, 0) / trends.length
    : 0;

  const filtered = trends
    .filter(t => dirFilter === 'All' || t.direction === dirFilter)
    .filter(t => !search || t.companyName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'delta')    cmp = b.delta    - a.delta;
      if (sortKey === 'score')    cmp = b.currentScore - a.currentScore;
      if (sortKey === 'velocity') cmp = b.velocity  - a.velocity;
      if (sortKey === 'name')     cmp = a.companyName.localeCompare(b.companyName);
      return sortDir === 'asc' ? -cmp : cmp;
    });

  if (loading || pmLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-20" />)}
        </div>
        <SkeletonCard className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto animate-page-in">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Improving',  value: improving, color: '#00A651', bg: 'rgba(0,166,81,0.08)',    icon: <TrendingUp  size={15} /> },
          { label: 'Declining',  value: declining, color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   icon: <TrendingDown size={15} /> },
          { label: 'Stable',     value: stable,    color: 'var(--text-muted)', bg: 'var(--bg)',    icon: <Minus size={15} /> },
          {
            label: 'Avg Δ',
            value: `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}`,
            color: avgDelta >= 0 ? '#00A651' : '#EF4444',
            bg:    avgDelta >= 0 ? 'rgba(0,166,81,0.08)' : 'rgba(239,68,68,0.08)',
            icon:  avgDelta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />,
          },
        ].map(c => (
          <div key={c.label} className="card flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: c.bg, color: c.color }}
            >
              {c.icon}
            </div>
            <div>
              <p className="text-xl font-bold leading-tight" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 min-w-44 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies…"
              className="flex-1 text-xs bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Direction pills */}
          <div className="flex gap-1.5">
            {(['All', 'improving', 'declining', 'stable'] as DirFilter[]).map(d => {
              const active = dirFilter === d;
              const color  = d === 'All' ? 'var(--sanlam-teal)'
                           : d === 'improving' ? '#00A651'
                           : d === 'declining' ? '#EF4444'
                           : 'var(--text-muted)';
              return (
                <button
                  key={d}
                  onClick={() => setDirFilter(d)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition pressable"
                  style={{
                    background: active ? `${color}15` : 'var(--bg)',
                    color:      active ? color        : 'var(--text-muted)',
                    border:     `1px solid ${active ? `${color}30` : 'var(--border)'}`,
                  }}
                >
                  {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop table */}
        <div>
          {/* Header */}
          <div
            className="hidden lg:grid px-3 py-2.5 gap-2 rounded-xl mb-1"
            style={{
              gridTemplateColumns: '2.5fr 1fr 1fr 80px 1fr',
              background: 'var(--bg)',
            }}
          >
            <SortHeader label="Company"  sortKey="name"     current={sortKey} dir={sortDir} onSort={handleSort} />
            <SortHeader label="Score"    sortKey="score"    current={sortKey} dir={sortDir} onSort={handleSort} className="justify-center" />
            <SortHeader label="Δ Score"  sortKey="delta"    current={sortKey} dir={sortDir} onSort={handleSort} className="justify-center" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-center"
              style={{ color: 'var(--text-muted)' }}>
              Trend
            </span>
            <SortHeader label="Velocity" sortKey="velocity" current={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((t, idx) => {
              const clsColors = CLASSIFICATION_COLORS[t.classification];
              const dot       = avatarColor(t.companyName);
              const spark     = sparkColor(t.direction);
              return (
                <div
                  key={t.companyId}
                  onClick={() => router.push(`/company/${t.companyId}`)}
                  className="px-3 py-3 cursor-pointer rounded-xl transition-colors animate-card-in"
                  style={{ animationDelay: `${idx * 20}ms` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Mobile */}
                  <div className="lg:hidden flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: dot }}
                    >
                      {ini(t.companyName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{t.companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.currentScore.toFixed(1)}</span>
                        <span className="text-xs font-semibold" style={{ color: dirColor(t.direction) }}>
                          {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <MiniSparkline data={t.history} color={spark} />
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>

                  {/* Desktop */}
                  <div
                    className="hidden lg:grid gap-2 items-center"
                    style={{ gridTemplateColumns: '2.5fr 1fr 1fr 80px 1fr' }}
                  >
                    {/* Company */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: dot }}
                      >
                        {ini(t.companyName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {t.companyName}
                        </p>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: clsColors.bg, color: clsColors.text }}
                        >
                          {t.classification}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <p className="text-sm font-bold text-center" style={{ color: 'var(--text-primary)' }}>
                      {t.currentScore.toFixed(1)}
                    </p>

                    {/* Delta */}
                    <p className="text-sm font-bold text-center" style={{ color: dirColor(t.direction) }}>
                      {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(1)}
                    </p>

                    {/* Sparkline */}
                    <div className="flex justify-center">
                      <MiniSparkline data={t.history} color={spark} />
                    </div>

                    {/* Velocity */}
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-sm font-semibold" style={{ color: dirColor(t.direction) }}>
                        {t.velocity >= 0 ? '+' : ''}{t.velocity.toFixed(2)}
                      </span>
                      {t.direction === 'improving' && <TrendingUp  size={13} style={{ color: '#00A651', flexShrink: 0 }} />}
                      {t.direction === 'declining' && <TrendingDown size={13} style={{ color: '#EF4444', flexShrink: 0 }} />}
                      {t.direction === 'stable'    && <Minus        size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-14 text-center">
                <TrendingUp size={28} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {trends.length === 0 ? 'No score history available yet.' : 'No companies match your filter.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
