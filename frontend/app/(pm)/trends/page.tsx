'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePMData, PMScorecard } from '@/hooks/usePMData';
import { CLASSIFICATION_COLORS } from '@/lib/sdg';
import { SkeletonCard } from '@/components/shared/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendEntry {
  companyId:       string;
  companyName:     string;
  sector:          string;
  currentScore:    number;
  prevScore:       number;
  delta:           number;
  direction:       'improving' | 'declining' | 'stable';
  velocity:        number;   // average score change per period
  history:         number[]; // up to 8 scores, oldest first
  classification:  'Low' | 'Medium' | 'High';
}

type SortKey = 'delta' | 'score' | 'velocity' | 'name';
type DirectionFilter = 'All' | 'improving' | 'declining' | 'stable';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function MiniSparkline({
  data,
  color,
  width = 80,
  height = 28,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) {
    return <svg width={width} height={height}><line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1.5} opacity={0.3} /></svg>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={color} opacity={0.1} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle
        cx={parseFloat(pts[pts.length - 1].split(',')[0])}
        cy={parseFloat(pts[pts.length - 1].split(',')[1])}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function directionColor(d: TrendEntry['direction']) {
  if (d === 'improving') return '#00A651';
  if (d === 'declining') return '#EF4444';
  return 'var(--text-muted)';
}

function companyColor(name: string) {
  const palette = ['#00B5ED', '#00A651', '#F59E0B', '#6366F1', '#EC4899', '#EF4444', '#8B5CF6', '#10B981'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function ini(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const router = useRouter();
  const { portfolio, loading: pmLoading } = usePMData();

  const [trends,    setTrends]    = useState<TrendEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sortKey,   setSortKey]   = useState<SortKey>('delta');
  const [direction, setDirection] = useState<DirectionFilter>('All');
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    if (portfolio.length === 0) { setLoading(false); return; }

    const load = async () => {
      try {
        setLoading(true);
        const entries = await Promise.all(
          portfolio.map(async ({ company, scorecard }) => {
            const snap = await getDocs(
              query(collection(db, 'scorecards'), where('companyId', '==', company.id))
            );
            // Client-side sort — no orderBy to avoid Firestore index requirement
            const sorted = snap.docs
              .map(d => d.data() as PMScorecard)
              .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt))
              .slice(-8);

            const history = sorted.map(s => s.overallScore);
            const current = history[history.length - 1] ?? scorecard?.overallScore ?? 0;
            const prev    = history.length >= 2 ? history[history.length - 2] : current;
            const delta   = current - prev;

            const velocity = history.length >= 2
              ? history.slice(1).reduce((sum, v, i) => sum + (v - history[i]), 0) / (history.length - 1)
              : 0;

            const dir: TrendEntry['direction'] =
              delta > 1.5 ? 'improving' : delta < -1.5 ? 'declining' : 'stable';

            return {
              companyId:      company.id,
              companyName:    company.name,
              sector:         company.sector,
              currentScore:   current,
              prevScore:      prev,
              delta,
              direction:      dir,
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
  }, [portfolio.length]);

  // Momentum summary
  const improving = trends.filter(t => t.direction === 'improving').length;
  const declining  = trends.filter(t => t.direction === 'declining').length;
  const stable     = trends.filter(t => t.direction === 'stable').length;
  const avgDelta   = trends.length > 0
    ? trends.reduce((s, t) => s + t.delta, 0) / trends.length
    : 0;

  // Filtered + sorted
  const filtered = trends
    .filter(t => direction === 'All' || t.direction === direction)
    .filter(t => !search || t.companyName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'delta')    return b.delta - a.delta;
      if (sortKey === 'score')    return b.currentScore - a.currentScore;
      if (sortKey === 'velocity') return b.velocity - a.velocity;
      return a.companyName.localeCompare(b.companyName);
    });

  if (loading || pmLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Momentum summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Improving',
            value: improving,
            color: '#00A651',
            bg:    'rgba(0,166,81,0.08)',
            icon:  <TrendingUp size={16} />,
          },
          {
            label: 'Declining',
            value: declining,
            color: '#EF4444',
            bg:    'rgba(239,68,68,0.08)',
            icon:  <TrendingDown size={16} />,
          },
          {
            label: 'Stable',
            value: stable,
            color: 'var(--text-muted)',
            bg:    'var(--bg)',
            icon:  <Minus size={16} />,
          },
          {
            label: 'Avg Δ Score',
            value: null,
            raw:   avgDelta,
            color: avgDelta >= 0 ? '#00A651' : '#EF4444',
            bg:    avgDelta >= 0 ? 'rgba(0,166,81,0.08)' : 'rgba(239,68,68,0.08)',
            icon:  avgDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
          },
        ].map(c => (
          <div key={c.label} className="card">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: c.color }}>{c.icon}</span>
              <span className="text-2xl font-bold" style={{ color: c.color }}>
                {c.value !== null ? c.value : `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}`}
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters and sort */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Direction filter pills */}
          <div className="flex gap-1.5">
            {(['All', 'improving', 'declining', 'stable'] as DirectionFilter[]).map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: direction === d ? 'var(--sanlam-teal)' : 'var(--bg)',
                  color:      direction === d ? '#fff'                : 'var(--text-muted)',
                  border:     '1px solid var(--border)',
                }}
              >
                {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort buttons */}
          <div className="flex gap-1.5 ml-auto">
            {([
              { key: 'delta',    label: 'Δ Score' },
              { key: 'score',    label: 'Score'   },
              { key: 'velocity', label: 'Velocity'},
              { key: 'name',     label: 'Name'    },
            ] as { key: SortKey; label: string }[]).map(s => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: sortKey === s.key ? 'rgba(0,181,237,0.12)' : 'var(--bg)',
                  color:      sortKey === s.key ? 'var(--sanlam-teal)'    : 'var(--text-muted)',
                  border:     '1px solid var(--border)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-xs outline-none"
            style={{
              background: 'var(--bg)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
              minWidth:   140,
            }}
          />
        </div>

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 pb-2 text-[11px] font-semibold"
          style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
          <div className="col-span-4">Company</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-2 text-center">Δ vs Prev</div>
          <div className="col-span-2 text-center">Trend</div>
          <div className="col-span-2 text-right">Velocity</div>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.map(t => {
            const clsColors = CLASSIFICATION_COLORS[t.classification];
            const dotColor  = companyColor(t.companyName);
            const lineColor = t.direction === 'improving' ? '#00A651'
                            : t.direction === 'declining' ? '#EF4444'
                            : '#6366F1';
            return (
              <button
                key={t.companyId}
                onClick={() => router.push(`/company/${t.companyId}`)}
                className="w-full text-left px-3 py-3 transition-colors hover:rounded-xl"
                style={{ display: 'block' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Mobile layout */}
                <div className="lg:hidden flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: dotColor }}
                  >
                    {ini(t.companyName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{t.companyName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.currentScore.toFixed(1)}</span>
                      <span className="text-xs font-semibold" style={{ color: directionColor(t.direction) }}>
                        {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <MiniSparkline data={t.history} color={lineColor} />
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Desktop grid layout */}
                <div className="hidden lg:grid grid-cols-12 gap-2 items-center">
                  {/* Company */}
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: dotColor }}
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
                  <div className="col-span-2 text-center">
                    <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      {t.currentScore.toFixed(1)}
                    </span>
                  </div>

                  {/* Delta */}
                  <div className="col-span-2 text-center">
                    <span
                      className="text-sm font-bold"
                      style={{ color: directionColor(t.direction) }}
                    >
                      {t.delta >= 0 ? '+' : ''}{t.delta.toFixed(1)}
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="col-span-2 flex justify-center">
                    <MiniSparkline data={t.history} color={lineColor} />
                  </div>

                  {/* Velocity */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: directionColor(t.direction) }}>
                      {t.velocity >= 0 ? '+' : ''}{t.velocity.toFixed(2)}
                    </span>
                    {t.direction === 'improving' && <TrendingUp  size={13} style={{ color: '#00A651', flexShrink: 0 }} />}
                    {t.direction === 'declining' && <TrendingDown size={13} style={{ color: '#EF4444', flexShrink: 0 }} />}
                    {t.direction === 'stable'    && <Minus        size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <TrendingUp size={28} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No companies match your filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
