'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  TrendingUp, Minus, AlertTriangle, X,
  ArrowUpRight, ArrowDownRight, Download,
} from 'lucide-react';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';
import type { SDGScoreData } from '@/hooks/useSMEData';
import { db } from '@/lib/firebase';
import { SDG_LIST, CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/sdg';
import { SkeletonScorecard } from '@/components/shared/Skeleton';
import AnimatedScore from '@/components/shared/AnimatedScore';
import Tooltip from '@/components/shared/Tooltip';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';
import { getLessonsBySDG } from '@/lib/learn-content';
import { getKPIsForSDG } from '@/lib/kpi-data';
import { exportScorecardPDF } from '@/lib/export-pdf';
import ImprovementPlan from '@/components/sme/ImprovementPlan';

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

const IMPROVEMENT_ACTIONS: Record<number, string[]> = {
  1: ['Track CSI spend', 'Document SME funding', 'Report jobs supported'],
  4: ['Start formal apprenticeships', 'Partner with a SETA', 'Document NQF-aligned training'],
  5: ['Set female hiring targets', 'Track women-owned procurement', 'Review ownership representation'],
  7: ['Measure annual kWh', 'Assess solar or PPA options', 'Reduce grid electricity use'],
  8: ['Convert stable roles to permanent', 'Hire youth employees', 'Track revenue and SME suppliers'],
  10: ['Update B-BBEE certificate', 'Increase Black ownership', 'Shift procurement to Black-owned suppliers'],
  13: ['Calculate Scope 1 and 2', 'Set a reduction target', 'Improve recycling and renewable energy use'],
};

function scoreColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

function classifyKPI(kpiId: string, value: number): 'High' | 'Medium' | 'Low' {
  const inverted = [
    'scope1_co2e',
    'scope2_co2e',
    'total_water_consumption',
    'electricity_consumption',
    'bbbee_rating',
    'average_cost_of_service',
  ];

  if (inverted.includes(kpiId)) {
    if (value <= 50) return 'High';
    if (value <= 200) return 'Medium';
    return 'Low';
  }

  if (kpiId.endsWith('_pct')) {
    if (value >= 60) return 'High';
    if (value >= 25) return 'Medium';
    return 'Low';
  }

  if (value >= 20) return 'High';
  if (value >= 5) return 'Medium';
  return 'Low';
}

function formatKPIValue(value: number, unit: string): string {
  if (unit === 'ZAR') return `R${value.toLocaleString('en-ZA')}`;
  if (unit === '%') return `${value}%`;
  return `${value} ${unit}`;
}

function classificationColor(classification: string) {
  return classification === 'High' ? '#00A651' : classification === 'Medium' ? '#E8A020' : '#D0021B';
}

// ─── Drill-down panel ──────────────────────────────────────────────────────

function DrillDownPanel({
  selected,
  onClose,
  submissionData,
}: {
  selected: SDGScoreData;
  onClose: () => void;
  submissionData?: Record<string, number | null>;
}) {
  const router  = useRouter();
  const sdg     = SDG_LIST.find(s => s.id === selected.sdgId)!;
  const cc      = CLASSIFICATION_COLORS[selected.classification];
  const diff    = selected.score - selected.sectorAvg;
  const submittedKPIs = getKPIsForSDG(sdg.id)
    .map(kpi => ({ kpi, value: (submissionData || {})[kpi.id] }))
    .filter(({ value }) => value !== null && value !== undefined);

  return (
    <>
      {/* Detailed view */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{
          background: 'var(--surface, #fff)',
          animation:  'slideInRight 250ms ease-out forwards',
        }}
      >
        {/* SDG color strip */}
        <div className="h-1.5 w-full" style={{ background: sdg.color }} />

        <div className="p-5 sm:p-8 lg:p-10 relative min-h-full">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-8 sm:right-8 text-[#4A5568] hover:text-[#015376] p-2 rounded-lg hover:bg-[#F4F6F8] transition"
            aria-label="Close detailed view"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8 pr-12 max-w-6xl">
            <span className="text-4xl leading-none">{sdg.icon}</span>
            <div>
              <p className="text-[#015376] font-bold text-2xl sm:text-3xl leading-tight">{sdg.name}</p>
              <span
                className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
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

          <div className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] max-w-7xl">
            <div className="space-y-6">
              {/* Score summary */}
              <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border, #DDE3EC)' }}>
                <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-4">
                  Your score
                </p>
                <div className="flex items-end gap-3 mb-3">
                  <span
                    className="font-bold text-6xl leading-none"
                    style={{ color: scoreColor(selected.score) }}
                  >
                    {selected.score.toFixed(1)}
                  </span>
                  <span
                    className="mb-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: cc.bg,
                      color:      cc.text,
                      border:     `1px solid ${cc.border}`,
                    }}
                  >
                    {CLASSIFICATION_LABELS[selected.classification]}
                  </span>
                </div>
                <p className="text-[#4A5568] text-sm mb-4">out of 3.0</p>
                <div className="w-full h-3 rounded-full bg-[#DDE3EC] overflow-hidden">
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
              <div className="bg-[#F4F6F8] rounded-2xl p-6">
                <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-4">
                  How you compare
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#4A5568]">Your score</span>
                    <span className="font-bold text-base" style={{ color: scoreColor(selected.score) }}>
                      {selected.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#4A5568]">Sector average</span>
                    <span className="font-semibold text-base text-[#015376]">
                      {selected.sectorAvg.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-[#DDE3EC]">
                    <span className="text-sm text-[#4A5568]">Difference</span>
                    <span
                      className="font-bold text-base"
                      style={{ color: diff >= 0 ? '#00A651' : '#D0021B' }}
                    >
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div
                  className="mt-4 p-4 rounded-xl text-sm"
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
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
              {/* What this measures */}
              <div className="rounded-2xl border p-6 lg:p-8" style={{ borderColor: 'var(--border, #DDE3EC)' }}>
                <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-3">
                  What this measures
                </p>
                <p className="text-[#015376] text-base leading-7 max-w-3xl">
                  {SDG_DESCRIPTIONS[sdg.id]}
                </p>

                {submittedKPIs.length > 0 && (
                  <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      What&apos;s affecting your score
                    </p>
                    <div className="space-y-1.5">
                      {submittedKPIs.slice(0, 6).map(({ kpi, value }) => {
                        const numericValue = Number(value);
                        const kpiClass = classifyKPI(kpi.id, numericValue);
                        const color = classificationColor(kpiClass);

                        return (
                          <div
                            key={kpi.id}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                            style={{ background: 'var(--bg)' }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                {kpi.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {formatKPIValue(numericValue, kpi.unit)}
                              </span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: `${color}15`, color }}
                              >
                                {kpiClass}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="rounded-2xl border p-6 h-fit" style={{ borderColor: 'var(--border, #DDE3EC)' }}>
                <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-4">
                  Next steps
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push(`/coach?sdg=${sdg.id}`)}
                    className="w-full min-h-11 rounded-lg bg-[#00B5ED] px-4 py-3 text-white font-semibold text-sm hover:bg-[#0099CC] transition"
                  >
                    Ask AI Coach about this goal
                  </button>
                  <button
                    onClick={() => { onClose(); router.push('/submit'); }}
                    className="w-full min-h-11 rounded-lg border border-[#00B5ED] px-4 py-3 text-[#00B5ED] font-semibold text-sm hover:bg-[#C9EEFB] transition"
                  >
                    View submission form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const router = useRouter();
  const { company, scorecard, loading, error } = useSMEData();

  const [filter,   setFilter]   = useState<FilterType>('All');
  const [sort,     setSort]     = useState<SortType>('number');
  const [selected, setSelected] = useState<SDGScoreData | null>(null);
  const [submissionData, setSubmissionData] = useState<Record<string, number | null>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!scorecard) return;

    const loadSubmission = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'submissions'),
            where('companyId', '==', scorecard.companyId),
            where('status', '==', 'scored')
          )
        );
        if (!snap.empty) {
          const sorted = snap.docs
            .map(d => d.data())
            .sort((a, b) => (b.scoredAt || b.submittedAt || '').localeCompare(a.scoredAt || a.submittedAt || ''));
          setSubmissionData(sorted[0].data || {});
        }
      } catch (err) {
        console.error('Load submission error:', err);
      }
    };

    loadSubmission();
  }, [scorecard?.companyId]);

  const handleExport = async () => {
    if (!scorecard || !company) return;
    setExporting(true);
    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/improvement-plan/${company.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const actions = json.plan?.actions || [];

      await exportScorecardPDF(
        company.name,
        company.sector,
        scorecard.submissionPeriod,
        scorecard.overallScore,
        scorecard.classification,
        scorecard.sdgScores,
        actions
      );
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>Showing:</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(0,181,237,0.1)',
              color:      'var(--sanlam-teal, #00B5ED)',
            }}
          >
            {filter === 'All' ? 'All 17 goals' : `${filter} Impact goals`}
          </span>
        </div>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>
          Period:{' '}
          <strong style={{ color: 'var(--text-primary, #015376)' }}>
            {scorecard.submissionPeriod}
          </strong>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || !scorecard}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            {exporting
              ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Exporting...</>
              : <><Download size={12} /> Export PDF</>
            }
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>Overall:</span>
          <Tooltip content={`${CLASSIFICATION_LABELS[classification]} — ${overallScore.toFixed(1)} / 3.0`} position="left">
            <div
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center flex-shrink-0"
              style={{ border: `2px solid ${scoreColor(overallScore)}` }}
            >
              <AnimatedScore
                value={overallScore}
                className="font-bold text-sm leading-none"
                style={{ color: scoreColor(overallScore) }}
              />
              <span className="text-[8px]" style={{ color: 'var(--text-muted, #4A5568)' }}>/ 3.0</span>
            </div>
          </Tooltip>
        </div>
      </PageContext>

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

      {company && lowCount > 0 && (
        <ImprovementPlan companyId={company.id} />
      )}

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
              className="card text-left p-5 hover:shadow-md transition-all duration-150 overflow-hidden animate-card-in"
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

                  {score.classification === 'Low' && (
                    <div
                      className="mt-2 mb-3 rounded-lg p-3"
                      style={{ background: 'rgba(208,2,27,0.05)', border: '1px solid rgba(208,2,27,0.16)' }}
                    >
                      <p className="text-[11px] font-semibold mb-2" style={{ color: '#D0021B' }}>
                        Improvement plan
                      </p>
                      <div className="space-y-1.5">
                        {(IMPROVEMENT_ACTIONS[sdg.id] || ['Review source KPI data', 'Ask AI Coach for targeted actions', 'Update your next submission']).map(action => (
                          <div key={action} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D0021B' }} />
                            <span className="text-[11px]" style={{ color: 'var(--text-muted, #4A5568)' }}>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {score.classification === 'Low' && (() => {
                    const lessons = getLessonsBySDG(sdg.id);
                    if (lessons.length === 0) return null;
                    return (
                      <div
                        className="mt-2 pt-2 flex items-center gap-2"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <span className="text-[10px]">📖</span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            router.push('/learn');
                          }}
                          className="text-[11px] font-medium hover:underline"
                          style={{ color: 'var(--sanlam-teal)' }}
                        >
                          Learn how to improve this →
                        </button>
                      </div>
                    );
                  })()}
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
          submissionData={submissionData}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  );
}
