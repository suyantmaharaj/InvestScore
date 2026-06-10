'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';
import { CLASSIFICATION_COLORS } from '@/lib/sdg';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import { KPI_DISPLAY_LIST } from '@/lib/kpi-data';

interface HistoryEntry {
  scorecardId:      string;
  submissionId?:    string;
  submissionPeriod: string;
  overallScore:     number;
  classification:   'Low' | 'Medium' | 'High';
  calculatedAt:     string;
  highCount:        number;
  lowCount:         number;
  sdgScores:        Array<{
    sdgId:          number;
    sdgName:        string;
    score:          number;
    classification: 'Low' | 'Medium' | 'High';
  }>;
  submissionData:   Record<string, number | null>;
  submittedAt?:     string;
}

function scoreColor(score: number) {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

function formatKPIValue(value: number | null, unit?: string): string {
  if (value === null || value === undefined) return 'Not provided';
  if (unit === 'ZAR') return `R${value.toLocaleString('en-ZA')}`;
  if (unit === '%') return `${value}%`;
  return unit ? `${value.toLocaleString('en-ZA')} ${unit}` : value.toLocaleString('en-ZA');
}

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function TrendChart({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length < 2) return null;

  const W = 600; const H = 120; const PAD = 20;
  const minS = 1.0; const maxS = 3.0;
  const toY  = (s: number) => PAD + ((maxS - s) / (maxS - minS)) * (H - PAD * 2);
  const toX  = (i: number) => PAD + (i / (entries.length - 1)) * (W - PAD * 2);

  const points      = entries.map((e, i) => `${toX(i)},${toY(e.overallScore)}`).join(' ');
  const areaPoints  = [
    `${toX(0)},${H - PAD}`,
    ...entries.map((e, i) => `${toX(i)},${toY(e.overallScore)}`),
    `${toX(entries.length - 1)},${H - PAD}`,
  ].join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {[1.0, 1.5, 2.0, 2.5, 3.0].map(v => (
        <g key={v}>
          <line
            x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4"
          />
          <text
            x={PAD - 4} y={toY(v) + 4}
            fontSize="9" textAnchor="end" fill="var(--text-muted)" fontFamily="Inter, sans-serif"
          >
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      <polygon points={areaPoints} fill="rgba(0,181,237,0.08)" />

      <polyline
        points={points} fill="none"
        stroke="var(--sanlam-teal, #00B5ED)" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
      />

      {entries.map((e, i) => (
        <g key={i}>
          <circle
            cx={toX(i)} cy={toY(e.overallScore)} r="5"
            fill={scoreColor(e.overallScore)} stroke="var(--surface)" strokeWidth="2"
          />
          <text
            x={toX(i)} y={toY(e.overallScore) - 12}
            fontSize="10" textAnchor="middle"
            fill={scoreColor(e.overallScore)} fontWeight="700" fontFamily="Inter, sans-serif"
          >
            {e.overallScore.toFixed(1)}
          </text>
          <text
            x={toX(i)} y={H - 4}
            fontSize="9" textAnchor="middle"
            fill="var(--text-muted)" fontFamily="Inter, sans-serif"
          >
            {e.submissionPeriod}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HistoryPage() {
  const router      = useRouter();
  const { user }    = useAuth();
  const [entries,  setEntries]  = useState<HistoryEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [openId,   setOpenId]   = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId) { setLoading(false); return; }

    const load = async () => {
      try {
        const [scorecardSnap, submissionSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'scorecards'),
              where('companyId', '==', user.companyId),
            )
          ),
          getDocs(
            query(
              collection(db, 'submissions'),
              where('companyId', '==', user.companyId),
              where('status', '==', 'scored'),
            )
          ),
        ]);

        const submissions = submissionSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const submissionById = new Map(submissions.map((s: any) => [s.id || s.submissionId, s]));
        const submissionByPeriod = new Map(submissions.map((s: any) => [s.period, s]));

        const data: HistoryEntry[] = scorecardSnap.docs
          .map(d => {
            const sc = d.data();
            const submission = submissionById.get(sc.submissionId) || submissionByPeriod.get(sc.submissionPeriod);
            return {
              scorecardId:      d.id,
              submissionId:     sc.submissionId,
              submissionPeriod: sc.submissionPeriod,
              overallScore:     sc.overallScore,
              classification:   sc.classification,
              calculatedAt:     sc.calculatedAt,
              highCount:        (sc.sdgScores || []).filter((s: { classification: string }) => s.classification === 'High').length,
              lowCount:         (sc.sdgScores || []).filter((s: { classification: string }) => s.classification === 'Low').length,
              sdgScores:        sc.sdgScores || [],
              submissionData:   (submission as any)?.data || {},
              submittedAt:      (submission as any)?.submittedAt,
            };
          })
          .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt));
        setEntries(data);
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.companyId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <SkeletonCard className="h-40" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No submission history yet"
        description="Submit your first SDG data to start tracking your progress over time."
        action={
          <button className="btn-primary mx-auto" onClick={() => router.push('/submit')}>
            Submit your data
          </button>
        }
      />
    );
  }

  const latest   = entries[entries.length - 1];
  const previous = entries.length > 1 ? entries[entries.length - 2] : null;
  const trend    = previous ? latest.overallScore - previous.overallScore : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {entries.length} submission{entries.length > 1 ? 's' : ''} on record
        </span>
        {previous && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span
              className="text-xs font-medium"
              style={{ color: trend >= 0 ? '#00A651' : '#D0021B' }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)} vs previous period
            </span>
          </>
        )}
      </PageContext>

      {entries.length >= 2 && (
        <div className="card p-5" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Score Progression
          </p>
          <TrendChart entries={entries} />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          All Submissions
        </p>
        <div className="space-y-3">
          {[...entries].reverse().map((entry, idx) => {
            const cc       = CLASSIFICATION_COLORS[entry.classification];
            const isLatest = idx === 0;
            const isOpen   = openId === entry.scorecardId;
            const submittedKpis = Object.entries(entry.submissionData || {})
              .filter(([, value]) => value !== null && value !== undefined)
              .map(([id, value]) => ({
                id,
                value,
                meta: KPI_DISPLAY_LIST.find(kpi => kpi.id === id),
              }))
              .sort((a, b) => {
                const catA = a.meta?.category || 'other';
                const catB = b.meta?.category || 'other';
                if (catA !== catB) return catA.localeCompare(catB);
                return (a.meta?.label || a.id).localeCompare(b.meta?.label || b.id);
              });
            const groupedKpis = submittedKpis.reduce<Record<string, typeof submittedKpis>>((acc, item) => {
              const key = item.meta?.category || 'other';
              acc[key] = acc[key] || [];
              acc[key].push(item);
              return acc;
            }, {});

            return (
              <div
                key={entry.scorecardId}
                className="card p-5 animate-card-in"
                style={{
                  background:     'var(--surface)',
                  animationDelay: `${idx * 50}ms`,
                  borderLeft:     isLatest ? '4px solid var(--sanlam-teal)' : '4px solid var(--border)',
                }}
              >
                <button
                  onClick={() => setOpenId(prev => prev === entry.scorecardId ? null : entry.scorecardId)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {entry.submissionPeriod}
                      </p>
                      {isLatest && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
                        >
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(entry.submittedAt || entry.calculatedAt).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center hidden sm:block">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>High</p>
                      <p className="font-bold text-sm" style={{ color: '#00A651' }}>{entry.highCount}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Low</p>
                      <p className="font-bold text-sm" style={{ color: '#D0021B' }}>{entry.lowCount}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-bold text-xl leading-none mb-1"
                        style={{ color: scoreColor(entry.overallScore) }}
                      >
                        {entry.overallScore.toFixed(1)}
                      </p>
                      {cc && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
                        >
                          {entry.classification}
                        </span>
                      )}
                    </div>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                      : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                    }
                  </div>
                </button>

                <div className="mt-3">
                  <AnimatedProgressBar
                    value={((entry.overallScore - 1) / 2) * 100}
                    color={scoreColor(entry.overallScore)}
                    height={4}
                    delay={idx * 50 + 200}
                  />
                </div>

                {isOpen && (
                  <div className="mt-5 pt-5 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] gap-5">
                      <div>
                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                          Submitted KPI values
                        </p>
                        {submittedKpis.length === 0 ? (
                          <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                            No submitted KPI values were found for this submission.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(groupedKpis).map(([category, items]) => (
                              <div key={category}>
                                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                  {categoryLabel(category)}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {items.map(({ id, value, meta }) => (
                                    <div
                                      key={id}
                                      className="rounded-xl p-3"
                                      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                                    >
                                      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                                        {meta?.label || id.replace(/_/g, ' ')}
                                      </p>
                                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {formatKPIValue(value, meta?.unit)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                          SDG scores from this submission
                        </p>
                        <div className="space-y-2">
                          {[...entry.sdgScores]
                            .sort((a, b) => a.sdgId - b.sdgId)
                            .map(sdg => {
                              const sdgCc = CLASSIFICATION_COLORS[sdg.classification];
                              return (
                                <div
                                  key={sdg.sdgId}
                                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                      SDG {sdg.sdgId}: {sdg.sdgName}
                                    </p>
                                    <span
                                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                      style={{ background: sdgCc.bg, color: sdgCc.text, border: `1px solid ${sdgCc.border}` }}
                                    >
                                      {sdg.classification}
                                    </span>
                                  </div>
                                  <p className="text-sm font-bold flex-shrink-0" style={{ color: scoreColor(sdg.score) }}>
                                    {sdg.score.toFixed(1)}
                                  </p>
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

    </div>
  );
}
