'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter }   from 'next/navigation';
import {
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db }          from '@/lib/firebase';
import { useAuth }     from '@/hooks/useAuth';
import { SDG_LIST }    from '@/lib/sdg';
import SDGIcon         from '@/components/sdg/SDGIcon';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext      from '@/components/shared/PageContext';
import { TrendingUp, TrendingDown, Minus, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { KPI_DISPLAY_LIST } from '@/lib/kpi-data';
import { CLASSIFICATION_COLORS } from '@/lib/sdg';

interface HistoryEntry {
  id:             string;
  period:         string;
  submissionId?:  string;
  calculatedAt:   string;
  overallScore:   number;
  classification: string;
  sdgScores:      Array<{
    sdgId:          number;
    score:          number;
    classification: string;
  }>;
  submissionData?: Record<string, number | null>;
  submittedAt?:    string;
}

function Sparkline({
  values, width = 80, height = 32, color,
}: {
  values: number[]; width?: number; height?: number; color: string;
}) {
  if (values.length < 2) return null;

  const min   = Math.min(...values, 1.0);
  const max   = Math.max(...values, 3.0);
  const range = max - min || 1;
  const pad   = 4;
  const w     = width  - pad * 2;
  const h     = height - pad * 2;

  const points = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * w,
    y: pad + (1 - (v - min) / range) * h,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  );
}

function ScoreLineChart({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length < 1) return null;

  const W = 560; const H = 180;
  const PAD_L = 40; const PAD_R = 20; const PAD_T = 16; const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const toX = (i: number) =>
    PAD_L + (i / Math.max(entries.length - 1, 1)) * plotW;
  const toY = (s: number) =>
    PAD_T + (1 - (s - 1) / 2) * plotH;

  const pathD = entries
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e.overallScore).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L${toX(entries.length - 1).toFixed(1)},${(PAD_T + plotH).toFixed(1)} L${PAD_L},${(PAD_T + plotH).toFixed(1)} Z`;

  const scoreColor = (s: number) =>
    s >= 2.4 ? '#00A651' : s >= 1.6 ? '#E8A020' : '#D0021B';

  const lastScore = entries[entries.length - 1].overallScore;
  const lineColor = scoreColor(lastScore);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Classification bands */}
        <rect x={PAD_L} y={PAD_T} width={plotW} height={toY(2.4) - PAD_T} fill="rgba(0,166,81,0.04)" />
        <rect x={PAD_L} y={toY(2.4)} width={plotW} height={toY(1.6) - toY(2.4)} fill="rgba(232,160,32,0.04)" />
        <rect x={PAD_L} y={toY(1.6)} width={plotW} height={PAD_T + plotH - toY(1.6)} fill="rgba(208,2,27,0.04)" />

        {/* Band labels */}
        {[
          { y: PAD_T + 10,  label: 'High',   c: '#00A651' },
          { y: toY(2.0),    label: 'Medium', c: '#E8A020' },
          { y: toY(1.3),    label: 'Low',    c: '#D0021B' },
        ].map(({ y, label, c }) => (
          <text key={label} x={PAD_L - 6} y={y}
            textAnchor="end" fontSize="9" fill={c} fontWeight="600" opacity="0.7">
            {label}
          </text>
        ))}

        {/* Threshold lines */}
        {[1.6, 2.4].map(s => (
          <line key={s} x1={PAD_L} y1={toY(s)} x2={W - PAD_R} y2={toY(s)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" />
        ))}

        {/* Y axis ticks */}
        {[1.0, 1.5, 2.0, 2.5, 3.0].map(s => (
          <g key={s}>
            <text x={PAD_L - 6} y={toY(s) + 3} textAnchor="end" fontSize="9"
              fill="var(--text-muted)">{s.toFixed(1)}</text>
            <line x1={PAD_L - 3} y1={toY(s)} x2={PAD_L} y2={toY(s)}
              stroke="var(--border)" strokeWidth="1" />
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={lineColor} opacity="0.08" />

        {/* Main line */}
        <path d={pathD} fill="none" stroke={lineColor}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {entries.map((e, i) => {
          const x = toX(i);
          const y = toY(e.overallScore);
          const c = scoreColor(e.overallScore);
          return (
            <g key={e.id}>
              <circle cx={x} cy={y} r="5" fill={c} />
              <circle cx={x} cy={y} r="3" fill="white" />
              <text x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                {e.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ScoreHistoryPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [sdgFilter,      setSdgFilter]      = useState<'all' | 'improving' | 'declining'>('all');
  const [openId,         setOpenId]         = useState<string | null>(null);
  const [collapsedCats,  setCollapsedCats]  = useState<Set<string>>(new Set());

  const toggleCat = (key: string) =>
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  useEffect(() => {
    if (!user?.companyId) return;
    const load = async () => {
      try {
        const [scorecardSnap, submissionSnap] = await Promise.all([
          getDocs(query(collection(db, 'scorecards'),  where('companyId', '==', user.companyId))),
          getDocs(query(collection(db, 'submissions'), where('companyId', '==', user.companyId))),
        ]);

        const subByPeriod = new Map<string, any>();
        const subById     = new Map<string, any>();
        submissionSnap.docs.filter(d => d.data().status === 'scored').forEach(d => {
          const s = { id: d.id, ...d.data() };
          if ((s as any).period)           subByPeriod.set((s as any).period,           s);
          if ((s as any).submissionPeriod) subByPeriod.set((s as any).submissionPeriod, s);
          subById.set(d.id, s);
        });

        const sorted = scorecardSnap.docs
          .map(d => {
            const sc  = d.data();
            const sub = subById.get(sc.submissionId) || subByPeriod.get(sc.submissionPeriod) || subByPeriod.get(sc.period);
            return {
              id:             d.id,
              period:         sc.submissionPeriod || sc.period || '',
              submissionId:   sc.submissionId,
              calculatedAt:   sc.calculatedAt,
              overallScore:   sc.overallScore,
              classification: sc.classification,
              sdgScores:      sc.sdgScores || [],
              submissionData: sub?.data    || null,
              submittedAt:    sub?.submittedAt || sc.calculatedAt,
            } as HistoryEntry;
          })
          .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt));

        setHistory(sorted);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.companyId]);

  const milestones = useMemo(() => {
    const events: { period: string; label: string; color: string; dot: string }[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      if (
        (prev.classification === 'Low'    && curr.classification === 'Medium') ||
        (prev.classification === 'Medium' && curr.classification === 'High')
      ) {
        events.push({
          period: curr.period,
          label:  `Moved to ${curr.classification} Impact`,
          color:  curr.classification === 'High' ? '#00A651' : '#E8A020',
          dot:    curr.classification === 'High' ? '🏆' : '⭐',
        });
      }
    }
    if (history.length > 0) {
      events.unshift({
        period: history[0].period,
        label:  'First submission',
        color:  'var(--sanlam-teal)',
        dot:    '🚀',
      });
    }
    return events;
  }, [history]);

  const sdgSeries = useMemo(() => {
    if (history.length < 2) return [];
    const sdgIds = [...new Set(history.flatMap(h => h.sdgScores.map(s => s.sdgId)))].sort((a, b) => a - b);
    return sdgIds.map(sdgId => {
      const values = history.map(h => {
        const s = h.sdgScores.find(s => s.sdgId === sdgId);
        return s?.score ?? null;
      });
      const first = values.find(v => v !== null);
      const last  = [...values].reverse().find(v => v !== null);
      const delta = first != null && last != null ? last - first : 0;
      return { sdgId, values, delta };
    });
  }, [history]);

  const latest        = history[history.length - 1];
  const first         = history[0];
  const overall_delta = latest && first ? latest.overallScore - first.overallScore : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-10 text-center" style={{ background: 'var(--surface)' }}>
          <p className="text-4xl mb-3">📈</p>
          <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            No score history yet
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Submit your data to get your first score. Your history builds with every quarterly submission.
          </p>
          <button
            onClick={() => router.push('/submit')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            Start first submission →
          </button>
        </div>
      </div>
    );
  }

  const scoreColor = (s: number) => s >= 2.4 ? '#00A651' : s >= 1.6 ? '#E8A020' : '#D0021B';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {history.length} submission{history.length !== 1 ? 's' : ''} on record
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Since {new Date(first.calculatedAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
        </span>
        {overall_delta !== 0 && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: overall_delta > 0 ? '#00A651' : '#D0021B' }}>
              {overall_delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {overall_delta > 0 ? '+' : ''}{overall_delta.toFixed(2)} overall
            </span>
          </>
        )}
      </PageContext>

      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Starting score',
            value: first.overallScore.toFixed(1),
            sub:   first.period,
            color: scoreColor(first.overallScore),
          },
          {
            label: 'Current score',
            value: latest.overallScore.toFixed(1),
            sub:   latest.period,
            color: scoreColor(latest.overallScore),
          },
          {
            label: 'Total improvement',
            value: overall_delta >= 0 ? `+${overall_delta.toFixed(2)}` : overall_delta.toFixed(2),
            sub:   `${history.length} period${history.length !== 1 ? 's' : ''}`,
            color: overall_delta > 0 ? '#00A651' : overall_delta < 0 ? '#D0021B' : '#E8A020',
          },
        ].map(({ label, value, sub, color }, i) => (
          <div key={label} className="card p-5 text-center animate-card-in"
            style={{ background: 'var(--surface)', animationDelay: `${i * 60}ms` }}>
            <p className="font-bold text-3xl mb-1" style={{ color }}>{value}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Score line chart */}
      <div data-tour="history-chart" className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Overall Score Trend
        </p>
        <ScoreLineChart entries={history} />
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div data-tour="history-milestones" className="card p-5" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} style={{ color: '#E8A020' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Milestones
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
            <div className="space-y-4 pl-10">
              {milestones.map((m, i) => (
                <div key={i} className="relative animate-card-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="absolute -left-7 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: m.color, top: '2px' }}>
                    {m.dot}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-SDG trend */}
      {sdgSeries.length > 0 && (
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              SDG Score Trends
            </p>
            <div className="flex items-center gap-1.5">
              {(['all', 'improving', 'declining'] as const).map(f => (
                <button key={f}
                  onClick={() => setSdgFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                  style={{
                    background: sdgFilter === f ? 'rgba(0,181,237,0.1)' : 'var(--bg)',
                    color:      sdgFilter === f ? 'var(--sanlam-teal)' : 'var(--text-muted)',
                  }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sdgSeries
              .filter(s => {
                if (sdgFilter === 'improving') return s.delta > 0;
                if (sdgFilter === 'declining') return s.delta < 0;
                return true;
              })
              .map((s, idx) => {
                const sdg         = SDG_LIST.find(d => d.id === s.sdgId);
                const validValues = s.values.filter((v): v is number => v !== null);
                const latestVal   = validValues[validValues.length - 1];
                const deltaColor  = s.delta > 0 ? '#00A651' : s.delta < 0 ? '#D0021B' : '#E8A020';
                const sc          = latestVal >= 2.4 ? '#00A651' : latestVal >= 1.6 ? '#E8A020' : '#D0021B';

                return (
                  <div key={s.sdgId} className="flex items-center gap-3 p-3 rounded-xl animate-card-in"
                    style={{ background: 'var(--bg)', animationDelay: `${idx * 20}ms` }}>
                    <SDGIcon sdgId={s.sdgId} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {sdg?.shortName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold" style={{ color: sc }}>
                          {latestVal?.toFixed(1) ?? '—'}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: deltaColor }}>
                          {s.delta > 0 ? '+' : ''}{s.delta.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Sparkline values={validValues} color={deltaColor} width={64} height={28} />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Submission history — expandable rows */}
      <div className="card" style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Submission History
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Click any row to see the full KPI data submitted that period
          </p>
        </div>

        {/* Header row */}
        <div className="grid px-5 py-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: '1fr 80px 100px 80px 24px',
            color:               'var(--text-muted)',
            borderBottom:        '1px solid var(--border)',
            background:          'var(--bg)',
          }}>
          <span>Period</span>
          <span className="text-center">Score</span>
          <span className="text-center">Classification</span>
          <span className="text-center">Change</span>
          <span />
        </div>

        {[...history].reverse().map((entry, idx) => {
          const prev      = history[history.length - 2 - idx];
          const delta     = prev ? entry.overallScore - prev.overallScore : null;
          const sc        = scoreColor(entry.overallScore);
          const dc        = delta === null ? 'var(--text-muted)' : delta > 0 ? '#00A651' : delta < 0 ? '#D0021B' : '#E8A020';
          const DeltaIcon = delta === null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          const isOpen    = openId === entry.id;

          // Build grouped KPI list for the drawer
          const kpiRows = Object.entries(entry.submissionData || {})
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([id, value]) => ({ id, value: value as number, meta: KPI_DISPLAY_LIST.find(k => k.id === id) }))
            .sort((a, b) => {
              const ca = a.meta?.category || 'z';
              const cb = b.meta?.category || 'z';
              return ca !== cb ? ca.localeCompare(cb) : (a.meta?.label || a.id).localeCompare(b.meta?.label || b.id);
            });

          const grouped = kpiRows.reduce<Record<string, typeof kpiRows>>((acc, row) => {
            const cat = row.meta?.category || 'other';
            acc[cat] = acc[cat] || [];
            acc[cat].push(row);
            return acc;
          }, {});

          const formatVal = (v: number, unit?: string) => {
            if (unit === 'ZAR') return `R${v.toLocaleString('en-ZA')}`;
            if (unit === '%')   return `${v}%`;
            return unit ? `${v.toLocaleString('en-ZA')} ${unit}` : v.toLocaleString('en-ZA');
          };

          const catLabel = (cat: string) =>
            cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          return (
            <div key={entry.id}
              style={{ borderBottom: idx < history.length - 1 ? '1px solid var(--border)' : 'none' }}>

              {/* Clickable summary row */}
              <button
                onClick={() => setOpenId(prev => prev === entry.id ? null : entry.id)}
                className="w-full grid px-5 py-3 items-center text-left transition"
                style={{
                  gridTemplateColumns: '1fr 80px 100px 80px 24px',
                  background: isOpen ? 'rgba(0,181,237,0.04)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {entry.period}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(entry.submittedAt || entry.calculatedAt).toLocaleDateString('en-ZA', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-center font-bold text-base" style={{ color: sc }}>
                  {entry.overallScore.toFixed(1)}
                </p>
                <span className="text-center text-xs font-semibold px-2 py-0.5 rounded mx-auto block w-fit"
                  style={{ background: `${sc}15`, color: sc }}>
                  {entry.classification}
                </span>
                <div className="flex items-center justify-center gap-1" style={{ color: dc }}>
                  {DeltaIcon && <DeltaIcon size={13} />}
                  <span className="text-xs font-semibold">
                    {delta !== null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}` : 'First'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Expanded detail drawer */}
              {isOpen && (
                <div className="px-5 pb-6 animate-fade-in"
                  style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 pt-5">

                    {/* KPI data */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-muted)' }}>
                        Submitted KPI Data
                      </p>
                      {kpiRows.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          No KPI data found for this submission.
                        </p>
                      ) : (
                        Object.entries(grouped).map(([cat, rows]) => {
                          const catKey    = `${entry.id}_${cat}`;
                          const collapsed = collapsedCats.has(catKey);
                          return (
                            <div key={cat} className="mb-3">
                              {/* Collapsible category header */}
                              <button
                                onClick={() => toggleCat(catKey)}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition"
                                style={{ background: 'var(--border)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                              >
                                <span className="text-[10px] font-semibold uppercase tracking-widest"
                                  style={{ color: 'var(--text-muted)' }}>
                                  {catLabel(cat)}
                                  <span className="ml-1.5 font-normal normal-case tracking-normal">
                                    ({rows.length})
                                  </span>
                                </span>
                                {collapsed
                                  ? <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                  : <ChevronUp   size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                }
                              </button>

                              {/* Rows — hidden when collapsed */}
                              {!collapsed && (
                                <div className="rounded-xl overflow-hidden mt-1"
                                  style={{ border: '1px solid var(--border)' }}>
                                  {rows.map((row, ri) => (
                                    <div key={row.id}
                                      className="flex items-center justify-between px-3 py-2"
                                      style={{
                                        borderBottom: ri < rows.length - 1 ? '1px solid var(--border)' : 'none',
                                        background: 'var(--surface)',
                                      }}>
                                      <span className="text-xs pr-4" style={{ color: 'var(--text-muted)' }}>
                                        {row.meta?.label || row.id.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-xs font-semibold flex-shrink-0"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {formatVal(row.value, row.meta?.unit)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* SDG scores for this period */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-muted)' }}>
                        SDG Scores This Period
                      </p>
                      <div className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid var(--border)' }}>
                        {[...entry.sdgScores]
                          .sort((a, b) => a.sdgId - b.sdgId)
                          .map((s, si) => {
                            const cc  = CLASSIFICATION_COLORS[s.classification as keyof typeof CLASSIFICATION_COLORS];
                            const col = s.score >= 2.4 ? '#00A651' : s.score >= 1.6 ? '#E8A020' : '#D0021B';
                            return (
                              <div key={s.sdgId}
                                className="flex items-center gap-2 px-3 py-2"
                                style={{
                                  borderBottom: si < entry.sdgScores.length - 1 ? '1px solid var(--border)' : 'none',
                                  background: 'var(--surface)',
                                }}>
                                <SDGIcon sdgId={s.sdgId} size={20} />
                                <span className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
                                  SDG {s.sdgId}
                                </span>
                                {cc && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{ background: cc.bg, color: cc.text }}>
                                    {s.classification}
                                  </span>
                                )}
                                <span className="text-xs font-bold w-8 text-right flex-shrink-0"
                                  style={{ color: col }}>
                                  {s.score.toFixed(1)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
