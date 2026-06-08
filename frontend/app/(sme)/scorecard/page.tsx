'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Minus, AlertTriangle, X,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';
import type { SDGScoreData } from '@/hooks/useSMEData';
import { SDG_LIST, CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/sdg';
import { SkeletonScorecard } from '@/components/shared/Skeleton';
import AnimatedScore from '@/components/shared/AnimatedScore';
import Tooltip from '@/components/shared/Tooltip';
import EmptyState from '@/components/shared/EmptyState';

type FilterType = 'All' | 'High' | 'Medium' | 'Low';
type SortType   = 'number' | 'score_desc' | 'score_asc';

const SDG_DESCRIPTIONS: Record<number, string> = {
  1:  'SDG 1 measures your contribution to poverty reduction. It tracks your CSI spending, the capital you deploy to underserved businesses, and the jobs your funded companies create.',
  2:  'SDG 2 focuses on food security and sustainable agriculture. It measures your local sourcing practices and the percentage of products from small producers.',
  3:  'SDG 3 looks at health and wellbeing. It measures your water consumption efficiency and access to clean water in your operations.',
  4:  'SDG 4 measures your investment in education and skills development. It tracks the number of apprentices and trainees your company supports.',
  5:  'SDG 5 focuses on gender equality. It measures female representation in your workforce, Black female ownership, and procurement spend with women-owned suppliers.',
  6:  'SDG 6 measures clean water access and sanitation. It tracks your water consumption, water loss reduction, and the number of connections to water supply.',
  7:  'SDG 7 focuses on clean and affordable energy. It measures your renewable energy production and use, electricity consumption, and carbon emissions.',
  8:  'SDG 8 measures decent work and economic growth. It tracks your total employment, youth employment, revenue, and the SMEs in your supply chain.',
  9:  'SDG 9 focuses on industry, innovation, and infrastructure. It measures production output, connectivity, and the reach of your infrastructure.',
  10: 'SDG 10 measures reduced inequalities. It tracks your B-BBEE rating, Black ownership, Black board representation, and procurement with Black-owned suppliers.',
  11: 'SDG 11 focuses on sustainable cities. It measures affordable housing units delivered and the affordability of rental prices.',
  12: 'SDG 12 measures responsible consumption. It tracks your recycling rate, sustainable product sales, and local material sourcing.',
  13: 'SDG 13 focuses on climate action. It measures your total carbon emissions (Scope 1 and 2), renewable energy use, and recycling practices.',
  14: 'SDG 14 measures the impact on life below water. It tracks your water consumption and water loss reduction practices.',
  15: 'SDG 15 focuses on life on land. It measures your recycling rate and local raw material sourcing practices.',
  16: 'SDG 16 measures peace and strong institutions. It tracks your governance quality through B-BBEE compliance and Black board representation.',
  17: 'SDG 17 measures partnerships for the goals. It tracks your local supplier network, SMEs in your supply chain, and procurement with diverse suppliers.',
};

function scoreColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

// ─── Drill-down panel ──────────────────────────────────────────────────────

function DrillDownPanel({
  selected,
  onClose,
}: {
  selected: SDGScoreData;
  onClose: () => void;
}) {
  const router  = useRouter();
  const sdg     = SDG_LIST.find(s => s.id === selected.sdgId)!;
  const cc      = CLASSIFICATION_COLORS[selected.classification];
  const diff    = selected.score - selected.sectorAvg;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-[420px] z-50 overflow-y-auto"
        style={{
          background: 'var(--surface, #fff)',
          boxShadow:  '-4px 0 24px rgba(0,0,0,0.08)',
          animation:  'slideInRight 250ms ease-out forwards',
        }}
      >
        {/* SDG color strip */}
        <div className="h-1.5 w-full" style={{ background: sdg.color }} />

        <div className="p-6 relative">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#4A5568] hover:text-[#015376] p-1 rounded-lg hover:bg-[#F4F6F8] transition"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 mb-5 pr-8">
            <span className="text-2xl">{sdg.icon}</span>
            <div>
              <p className="text-[#015376] font-semibold text-base leading-tight">{sdg.name}</p>
              <span
                className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${sdg.color}20`,
                  color:       sdg.color,
                  border:      `1px solid ${sdg.color}40`,
                }}
              >
                SDG {sdg.id}
              </span>
            </div>
          </div>

          {/* Score summary */}
          <div className="mb-5">
            <div className="flex items-end gap-3 mb-2">
              <span
                className="font-bold text-4xl leading-none"
                style={{ color: scoreColor(selected.score) }}
              >
                {selected.score.toFixed(1)}
              </span>
              <span
                className="mb-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: cc.bg,
                  color:      cc.text,
                  border:     `1px solid ${cc.border}`,
                }}
              >
                {CLASSIFICATION_LABELS[selected.classification]}
              </span>
            </div>
            <p className="text-[#4A5568] text-sm mb-3">out of 3.0</p>
            <div className="w-full h-2.5 rounded-full bg-[#DDE3EC] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${((selected.score - 1) / 2) * 100}%`,
                  background: scoreColor(selected.score),
                }}
              />
            </div>
          </div>

          {/* Sector comparison */}
          <div className="bg-[#F4F6F8] rounded-xl p-4 mb-5">
            <p className="text-[#4A5568] text-[11px] uppercase tracking-wider mb-3">
              How you compare
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4A5568]">Your score</span>
                <span className="font-bold text-sm" style={{ color: scoreColor(selected.score) }}>
                  {selected.score.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4A5568]">Sector average</span>
                <span className="font-semibold text-sm text-[#015376]">
                  {selected.sectorAvg.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#DDE3EC]">
                <span className="text-sm text-[#4A5568]">Difference</span>
                <span
                  className="font-bold text-sm"
                  style={{ color: diff >= 0 ? '#00A651' : '#D0021B' }}
                >
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              </div>
            </div>
            {/* Insight */}
            <div
              className="mt-3 p-3 rounded-lg text-xs"
              style={
                diff > 0.05
                  ? { background: '#DCFCE7', color: '#166534' }
                  : diff < -0.05
                  ? { background: '#FEF9C3', color: '#854D0E' }
                  : { background: '#F1F5F9', color: '#4A5568' }
              }
            >
              {diff > 0.05
                ? 'You are performing above your sector peers on this goal.'
                : diff < -0.05
                ? 'This goal is below your sector average. Your AI coach can help you improve.'
                : 'You are performing at the sector average for this goal.'}
            </div>
          </div>

          {/* What this measures */}
          <div className="mb-5">
            <p className="text-[#4A5568] text-[11px] uppercase tracking-wider mb-2">
              What this measures
            </p>
            <p className="text-[#015376] text-sm leading-relaxed">
              {SDG_DESCRIPTIONS[sdg.id]}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/coach?sdg=${sdg.id}`)}
              className="w-full h-11 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] transition"
            >
              Ask AI Coach about this goal
            </button>
            <button
              onClick={() => { onClose(); router.push('/submit'); }}
              className="w-full h-11 rounded-lg border border-[#00B5ED] text-[#00B5ED] font-semibold text-sm hover:bg-[#C9EEFB] transition"
            >
              View submission form
            </button>
          </div>
        </div>
      </div>

    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const router = useRouter();
  const { scorecard, loading, error } = useSMEData();

  const [filter,   setFilter]   = useState<FilterType>('All');
  const [sort,     setSort]     = useState<SortType>('number');
  const [selected, setSelected] = useState<SDGScoreData | null>(null);

  const scoreMap = useMemo(() => {
    if (!scorecard) return new Map<number, SDGScoreData>();
    return new Map(scorecard.sdgScores.map(s => [s.sdgId, s]));
  }, [scorecard]);

  const filteredSDGs = useMemo(() => {
    let list = SDG_LIST.map(sdg => ({
      sdg,
      score: scoreMap.get(sdg.id) ?? null,
    }));

    if (filter !== 'All') {
      list = list.filter(({ score }) => score?.classification === filter);
    }

    list.sort((a, b) => {
      if (sort === 'number')     return a.sdg.id - b.sdg.id;
      if (sort === 'score_desc') return (b.score?.score ?? 0) - (a.score?.score ?? 0);
      if (sort === 'score_asc')  return (a.score?.score ?? 0) - (b.score?.score ?? 0);
      return 0;
    });

    return list;
  }, [scoreMap, filter, sort]);

  if (loading) return <SkeletonScorecard />;

  if (error || !scorecard) {
    return (
      <EmptyState
        icon="🎯"
        title="No scorecard yet"
        description="Submit your SDG data to generate your scorecard."
        action={
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00B5ED] text-white text-sm font-semibold hover:bg-[#0099CC] transition mx-auto"
            onClick={() => router.push('/submit')}
          >
            Submit data
          </button>
        }
      />
    );
  }

  const { overallScore, classification, sdgScores } = scorecard;
  const highCount   = sdgScores.filter(s => s.classification === 'High').length;
  const mediumCount = sdgScores.filter(s => s.classification === 'Medium').length;
  const lowCount    = sdgScores.filter(s => s.classification === 'Low').length;
  const classColors = CLASSIFICATION_COLORS[classification];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[#015376] font-semibold text-xl">My SDG Scorecard</h1>
          <p className="text-[#4A5568] text-sm mt-1">
            Your sustainability performance across all 17 UN Sustainable Development Goals
          </p>
        </div>
        {/* Overall score circle */}
        <Tooltip content={`${CLASSIFICATION_LABELS[classification]} — ${overallScore.toFixed(1)} / 3.0`} position="left">
          <div
            className="flex flex-col items-center justify-center w-14 h-14 rounded-full flex-shrink-0"
            style={{ border: `3px solid ${scoreColor(overallScore)}` }}
          >
            <AnimatedScore
              value={overallScore}
              className="font-bold text-lg leading-none"
              style={{ color: scoreColor(overallScore) }}
            />
            <span className="text-[9px] leading-none mt-0.5" style={{ color: 'var(--text-muted, #4A5568)' }}>/ 3.0</span>
          </div>
        </Tooltip>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: TrendingUp,    count: highCount,   label: 'High Impact',     bg: '#DCFCE7', border: '#86EFAC', text: '#166534' },
          { icon: Minus,         count: mediumCount, label: 'Medium Impact',   bg: '#FEF9C3', border: '#FDE047', text: '#854D0E' },
          { icon: AlertTriangle, count: lowCount,    label: 'Needs Attention', bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' },
        ].map(({ icon: Icon, count, label, bg, border, text }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: bg, border: `1px solid ${border}`, color: text }}
          >
            <Icon size={14} />
            {count} {label}
          </div>
        ))}
      </div>

      {/* Filter + Sort bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['All', 'High', 'Medium', 'Low'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs rounded-lg border font-medium transition"
              style={{
                background:  filter === f ? '#00B5ED' : 'var(--surface, white)',
                color:       filter === f ? 'white'   : 'var(--text-muted, #4A5568)',
                borderColor: filter === f ? '#00B5ED' : 'var(--border, #DDE3EC)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortType)}
          className="text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00B5ED]"
          style={{ background: 'var(--surface, white)', color: 'var(--text-primary, #015376)', border: '1px solid var(--border, #DDE3EC)' }}
        >
          <option value="number">SDG Number</option>
          <option value="score_desc">Score: High to Low</option>
          <option value="score_asc">Score: Low to High</option>
        </select>
      </div>

      {/* SDG Goal Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSDGs.map(({ sdg, score }, idx) => {
          const cc   = score ? CLASSIFICATION_COLORS[score.classification] : null;
          const diff = score ? score.score - score.sectorAvg : 0;

          return (
            <button
              key={sdg.id}
              onClick={() => score && setSelected(score)}
              className="rounded-xl border text-left p-5 hover:shadow-md transition-all duration-150 overflow-hidden animate-card-in"
              style={{
                background:     'var(--surface, #fff)',
                borderColor:    'var(--border, #DDE3EC)',
                borderLeft:     `4px solid ${sdg.color}`,
                opacity:        score ? 1 : 0.45,
                cursor:         score ? 'pointer' : 'default',
                animationDelay: `${idx * 40}ms`,
              }}
            >
              {/* Top row: icon + name + SDG badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0">{sdg.icon}</span>
                  <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text-primary, #015376)' }}>
                    {sdg.name}
                  </p>
                </div>
                <Tooltip content={sdg.name} position="top">
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                    style={{
                      background: `${sdg.color}20`,
                      color:       sdg.color,
                      border:      `1px solid ${sdg.color}40`,
                    }}
                  >
                    SDG {sdg.id}
                  </span>
                </Tooltip>
              </div>

              {/* Score + bar + badge */}
              {score ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="font-bold text-lg"
                      style={{ color: scoreColor(score.score) }}
                    >
                      {score.score.toFixed(1)}
                    </span>
                    <div className="h-1.5 rounded-full bg-[#DDE3EC] overflow-hidden w-20 flex-shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:      `${((score.score - 1) / 2) * 100}%`,
                          background: scoreColor(score.score),
                        }}
                      />
                    </div>
                    {cc && (
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: cc.bg,
                          color:      cc.text,
                          border:     `1px solid ${cc.border}`,
                        }}
                      >
                        {score.classification}
                      </span>
                    )}
                  </div>

                  {/* Sector comparison */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#4A5568] text-xs">
                      Sector avg: {score.sectorAvg.toFixed(1)}
                    </span>
                    {diff > 0.05 ? (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                        <ArrowUpRight size={12} /> Above average
                      </span>
                    ) : diff < -0.05 ? (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
                        <ArrowDownRight size={12} /> Below average
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-[#4A5568]">
                        <Minus size={12} /> At average
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[#4A5568]/60 text-xs mb-3">
                  Not applicable for your sector
                </p>
              )}

              {/* View details */}
              {score && (
                <p className="text-[#00B5ED] text-xs font-medium text-right">
                  View details →
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Drill-down panel */}
      {selected && (
        <DrillDownPanel
          selected={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  );
}
