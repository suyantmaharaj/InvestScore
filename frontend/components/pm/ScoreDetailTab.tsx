'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { SDG_LIST } from '@/lib/sdg';
import SDGIcon from '@/components/sdg/SDGIcon';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';

interface KPI {
  kpiId:          string;
  label:          string;
  description:    string;
  rawValue:       number | null;
  unit:           string;
  thresholds:     { low: number; medium: number; high: number; inverted: boolean } | null;
  classification: 'Low' | 'Medium' | 'High' | 'N/A';
  kpiScore:       number | null;
  isReported:     boolean;
}

interface DrillDownData {
  company:       { id: string; name: string; sector: string; mandate: string };
  sdg: {
    id: number; score: number; classification: string;
    sectorAvg: number; previousScore: number | null;
    delta: number | null; sectorWeight: number | null;
    submissionPeriod: string;
  };
  kpis:          KPI[];
  reportedCount: number;
  totalCount:    number;
}

interface Props {
  companyId:    string;
  company:      any;
  scorecard:    any;
  defaultSdgId: number | null;
}

const CLASS_COLOR: Record<string, string> = {
  High:   '#00A651',
  Medium: '#E8A020',
  Low:    '#D0021B',
  'N/A':  '#4A5568',
};

async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

function ThresholdBar({ kpi }: { kpi: KPI }) {
  if (kpi.rawValue === null || !kpi.thresholds) return null;

  const { thresholds, rawValue, classification, unit } = kpi;
  const max    = Math.max(thresholds.high * 1.5, rawValue * 1.2, 1);
  const pct    = Math.min((rawValue / max) * 100, 100);
  const lowPct = (thresholds.low    / max) * 100;
  const medPct = (thresholds.medium / max) * 100;
  const hiPct  = (thresholds.high   / max) * 100;
  const color  = CLASS_COLOR[classification] || '#4A5568';

  return (
    <div>
      <div
        className="relative w-full h-6 rounded-lg overflow-hidden"
        style={{ background: 'var(--border)' }}
      >
        <div className="absolute inset-y-0 left-0"
          style={{ width: `${lowPct}%`, background: 'rgba(208,2,27,0.2)' }} />
        <div className="absolute inset-y-0"
          style={{ left: `${lowPct}%`, width: `${medPct - lowPct}%`, background: 'rgba(232,160,32,0.2)' }} />
        <div className="absolute inset-y-0"
          style={{ left: `${medPct}%`, width: `${hiPct - medPct}%`, background: 'rgba(0,166,81,0.2)' }} />
        {[lowPct, medPct, hiPct].map((p, i) => (
          <div key={i} className="absolute inset-y-0 w-px"
            style={{ left: `${p}%`, background: 'rgba(255,255,255,0.15)' }} />
        ))}
        <div
          className="absolute top-1.5 w-3 h-3 rounded-full border-2 border-white transition-all duration-700"
          style={{ left: `calc(${pct}% - 6px)`, background: color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {[
          { label: 'Low',    val: thresholds.low    },
          { label: 'Medium', val: thresholds.medium },
          { label: 'High',   val: thresholds.high   },
        ].map(({ label, val }) => (
          <span key={label} className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {label}: {val}{unit}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ScoreDetailTab({
  companyId, company, scorecard, defaultSdgId,
}: Props) {
  const firstSdgId = defaultSdgId || scorecard?.sdgScores?.[0]?.sdgId || 1;

  const [selectedSdg, setSelectedSdg] = useState<number>(firstSdgId);
  const [data,        setData]        = useState<DrillDownData | null>(null);
  const [insight,     setInsight]     = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [insLoading,  setInsLoading]  = useState(false);
  const [activePanel, setActivePanel] = useState<'raw' | 'calc' | 'insight'>('raw');

  useEffect(() => {
    if (!selectedSdg || !companyId) return;
    const load = async () => {
      setLoading(true);
      setData(null);
      setInsight(null);
      try {
        const res  = await apiFetch(`/api/pm/drilldown/${companyId}/${selectedSdg}`);
        if (!res) return;
        const json = await res.json();
        if (!json.error) setData(json);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedSdg, companyId]);

  const loadInsight = useCallback(async () => {
    if (!data || insight) return;
    setInsLoading(true);
    try {
      const res = await apiFetch(
        `/api/pm/drilldown/${companyId}/${selectedSdg}/insight`,
        { method: 'POST', body: JSON.stringify({ drilldownData: data }) }
      );
      if (!res) return;
      const json = await res.json();
      setInsight(json.insight);
    } finally {
      setInsLoading(false);
    }
  }, [data, insight, companyId, selectedSdg]);

  useEffect(() => {
    if (activePanel === 'insight') loadInsight();
  }, [activePanel, loadInsight]);

  const classColor = data ? (CLASS_COLOR[data.sdg.classification] || '#4A5568') : '#4A5568';

  return (
    <div className="flex gap-5 animate-fade-in" style={{ minHeight: '500px' }}>

      {/* LEFT: SDG selector */}
      <div className="flex-shrink-0" data-tour="score-detail-sdg-selector" style={{ width: '196px' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
          style={{ color: 'var(--text-muted)' }}>
          Select SDG goal
        </p>
        <div className="space-y-0.5">
          {SDG_LIST.map(sdg => {
            const sdgScore  = scorecard?.sdgScores?.find((s: any) => s.sdgId === sdg.id);
            const hasScore  = !!sdgScore;
            const sc        = sdgScore?.score ?? null;
            const scColor   = !sc ? '#4A5568'
              : sc >= 2.4 ? '#00A651'
              : sc >= 1.6 ? '#E8A020'
              : '#D0021B';
            const isSelected = selectedSdg === sdg.id;

            return (
              <button
                key={sdg.id}
                onClick={() => { setSelectedSdg(sdg.id); setActivePanel('raw'); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all pressable"
                style={{
                  background: isSelected ? `${scColor}12` : 'transparent',
                  border:     `1px solid ${isSelected ? scColor + '40' : 'transparent'}`,
                  opacity:    hasScore ? 1 : 0.35,
                }}
                disabled={!hasScore}
              >
                <SDGIcon sdgId={sdg.id} size={22} showNumber={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate"
                    style={{ color: isSelected ? scColor : 'var(--text-muted)' }}>
                    {sdg.shortName}
                  </p>
                </div>
                {hasScore && sc !== null && (
                  <span className="text-[11px] font-bold flex-shrink-0" style={{ color: scColor }}>
                    {sc.toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: detail panel */}
      <div className="flex-1 min-w-0">

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse"
                style={{ background: 'var(--bg)' }} />
            ))}
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-40 rounded-xl"
            style={{ background: 'var(--bg)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Select an SDG goal to see the breakdown
            </p>
          </div>
        ) : (
          <>
            {/* SDG header */}
            <div className="flex items-center gap-4 p-4 rounded-xl mb-4"
              style={{ background: 'var(--bg)' }}>
              <SDGIcon sdgId={data.sdg.id} size={48} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  SDG {data.sdg.id} — {SDG_LIST.find(s => s.id === data.sdg.id)?.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="font-bold text-xl" style={{ color: classColor }}>
                    {data.sdg.score.toFixed(2)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${classColor}15`, color: classColor }}>
                    {data.sdg.classification} Impact
                  </span>
                  {data.sdg.delta !== null && (
                    <span className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: data.sdg.delta >= 0 ? '#00A651' : '#D0021B' }}>
                      {data.sdg.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {data.sdg.delta >= 0 ? '+' : ''}{data.sdg.delta.toFixed(2)} vs last period
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sector avg: {data.sdg.sectorAvg?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* vs sector bar */}
              <div style={{ width: '120px' }}>
                <div className="flex justify-between text-[10px] mb-1"
                  style={{ color: 'var(--text-muted)' }}>
                  <span>Score</span>
                  <span style={{ color: data.sdg.score >= data.sdg.sectorAvg ? '#00A651' : '#D0021B' }}>
                    {data.sdg.score >= data.sdg.sectorAvg ? '▲ Above' : '▼ Below'} avg
                  </span>
                </div>
                <AnimatedProgressBar
                  value={((data.sdg.score - 1) / 2) * 100}
                  color={classColor}
                  height={6}
                />
                <div className="relative mt-0.5" style={{ height: '8px' }}>
                  <div className="absolute top-0 w-px h-2"
                    style={{ left: `${((data.sdg.sectorAvg - 1) / 2) * 100}%`, background: '#00B5ED' }} />
                  <span className="absolute text-[8px]"
                    style={{
                      left:      `${((data.sdg.sectorAvg - 1) / 2) * 100}%`,
                      top:       '2px',
                      color:     '#00B5ED',
                      transform: 'translateX(-50%)',
                    }}>
                    avg
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-tab bar */}
            <div data-tour="score-detail-panels" className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg)' }}>
              {[
                { key: 'raw',     label: 'Raw Data',    desc: `${data.reportedCount}/${data.totalCount} KPIs reported` },
                { key: 'calc',    label: 'Calculation', desc: 'How the score is derived'    },
                { key: 'insight', label: 'AI Insight',  desc: 'Investment context'           },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setActivePanel(key as typeof activePanel)}
                  className="flex-1 py-2.5 rounded-lg text-left px-3 transition-all pressable"
                  style={{ background: activePanel === key ? 'var(--sanlam-navy)' : 'transparent' }}
                >
                  <p className="text-xs font-semibold"
                    style={{ color: activePanel === key ? 'white' : 'var(--text-muted)' }}>
                    {label}
                  </p>
                  <p className="text-[10px] mt-0.5"
                    style={{ color: activePanel === key ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>
                    {desc}
                  </p>
                </button>
              ))}
            </div>

            {/* RAW DATA */}
            {activePanel === 'raw' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Submitted values from {data.sdg.submissionPeriod} —{' '}
                  {data.reportedCount} of {data.totalCount} KPIs reported
                </p>
                {data.kpis.map((kpi, idx) => (
                  <div
                    key={kpi.kpiId}
                    className="rounded-xl p-4 animate-card-in"
                    style={{
                      background:     'var(--bg)',
                      border:         `1px solid ${kpi.isReported ? 'var(--border)' : 'rgba(208,2,27,0.12)'}`,
                      opacity:         kpi.isReported ? 1 : 0.65,
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {kpi.label}
                        </p>
                        {kpi.description && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {kpi.description}
                          </p>
                        )}
                      </div>
                      {kpi.isReported ? (
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-base" style={{ color: CLASS_COLOR[kpi.classification] }}>
                            {kpi.rawValue?.toLocaleString()}{kpi.unit}
                          </p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${CLASS_COLOR[kpi.classification]}15`,
                              color:       CLASS_COLOR[kpi.classification],
                            }}
                          >
                            {kpi.classification}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B' }}
                        >
                          Not yet reported
                        </span>
                      )}
                    </div>
                    {kpi.isReported && kpi.thresholds && <ThresholdBar kpi={kpi} />}
                  </div>
                ))}
              </div>
            )}

            {/* CALCULATION */}
            {activePanel === 'calc' && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-xl p-4"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: 'var(--text-muted)' }}>
                    Score breakdown
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Final score',    value: data.sdg.score.toFixed(2),                                          color: classColor          },
                      { label: 'Sector average', value: data.sdg.sectorAvg?.toFixed(2) || '—',                              color: '#00B5ED'           },
                      { label: 'Sector weight',  value: data.sdg.sectorWeight ? `${(data.sdg.sectorWeight * 100).toFixed(0)}%` : '—', color: 'var(--text-muted)' },
                      { label: 'KPIs used',      value: `${data.reportedCount}/${data.totalCount}`,                          color: 'var(--text-muted)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-2 rounded-lg"
                        style={{ background: 'var(--surface)' }}>
                        <p className="font-bold text-base" style={{ color }}>{value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-4 text-sm"
                  style={{ background: 'var(--bg)', color: 'var(--text-muted)', lineHeight: '1.75' }}>
                  Each KPI mapping to SDG {data.sdg.id} is scored 1 (Low), 2 (Medium), or 3 (High) based on
                  the submitted value against Sanlam's thresholds. KPIs not yet reported are excluded.
                  The average of reported KPI scores is multiplied by the sector weight to produce the
                  weighted contribution to the overall portfolio score.
                </div>

                {/* KPI table */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-muted)' }}>
                    KPI contributions
                  </p>
                  <div
                    className="grid px-3 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-t-lg"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'var(--sanlam-navy)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    <span>KPI</span>
                    <span className="text-center">Value</span>
                    <span className="text-center">Score</span>
                    <span className="text-center">Classification</span>
                  </div>
                  {data.kpis.map((kpi, idx) => {
                    const kpiColor = kpi.isReported ? CLASS_COLOR[kpi.classification] : '#4A5568';
                    return (
                      <div
                        key={kpi.kpiId}
                        className="grid px-3 py-2.5 animate-card-in"
                        style={{
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          borderBottom:        '1px solid var(--border)',
                          background:          idx % 2 === 0 ? 'var(--bg)' : 'var(--surface)',
                          animationDelay:      `${idx * 25}ms`,
                        }}
                      >
                        <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{kpi.label}</p>
                        <p className="text-xs text-center" style={{ color: kpiColor }}>
                          {kpi.isReported ? `${kpi.rawValue}${kpi.unit}` : '—'}
                        </p>
                        <p className="text-xs text-center font-bold" style={{ color: kpiColor }}>
                          {kpi.isReported ? kpi.kpiScore : '—'}
                        </p>
                        <p className="text-xs text-center font-semibold" style={{ color: kpiColor }}>
                          {kpi.isReported ? kpi.classification : 'Not reported'}
                        </p>
                      </div>
                    );
                  })}
                  <div className="px-3 py-3 rounded-b-lg"
                    style={{ background: 'var(--bg)', borderTop: '2px solid var(--border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Formula</p>
                    <p className="text-xs mt-1"
                      style={{ fontFamily: 'monospace', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                      ({data.kpis.filter(k => k.isReported).map(k => k.kpiScore).join(' + ')})
                      {' ÷ '}
                      {data.reportedCount}
                      {' = '}
                      <span style={{ color: classColor, fontWeight: 700 }}>{data.sdg.score.toFixed(2)}</span>
                      {' '}
                      <span style={{ color: 'var(--text-muted)' }}>
                        ({data.reportedCount} of {data.totalCount} KPIs)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI INSIGHT */}
            {activePanel === 'insight' && (
              <div className="animate-fade-in">
                <div className="rounded-xl p-5"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={15} style={{ color: 'var(--sanlam-teal)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Investment Insight
                    </p>
                    <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                      Claude · Sanlam Investments
                    </span>
                  </div>

                  {insLoading ? (
                    <div className="space-y-2.5">
                      {[95, 88, 92, 78, 85].map((w, i) => (
                        <div key={i} className="h-3.5 rounded animate-pulse"
                          style={{ background: 'var(--surface)', width: `${w}%` }} />
                      ))}
                      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                        Analysing {data.company.name}'s SDG {data.sdg.id} data...
                      </p>
                    </div>
                  ) : insight ? (
                    <>
                      <p className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-primary)', lineHeight: '1.85' }}>
                        {insight}
                      </p>
                      <div className="flex items-start gap-2 mt-4 pt-3"
                        style={{ borderTop: '1px solid var(--border)' }}>
                        <AlertCircle size={11} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Advisory only. Based on submitted data from {data.sdg.submissionPeriod}.
                          Verify directly with the company before acting on this insight.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Failed to generate insight. Switch away and back to retry.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
