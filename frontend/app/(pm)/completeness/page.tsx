'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePMData } from '@/hooks/usePMData';
import { KPI_DISPLAY_LIST } from '@/lib/kpi-data';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';

const KPI_CATEGORIES = {
  employment:    KPI_DISPLAY_LIST.filter(k => k.category === 'employment'),
  environmental: KPI_DISPLAY_LIST.filter(k => k.category === 'environmental'),
  transformation: KPI_DISPLAY_LIST.filter(k => k.category === 'transformation'),
  community:     KPI_DISPLAY_LIST.filter(k => k.category === 'community'),
};

const CAT_COLORS: Record<string, string> = {
  employment:     '#00B5ED',
  environmental:  '#00A651',
  transformation: '#6366F1',
  community:      '#E8A020',
};

export default function DataCompletenessPage() {
  const router = useRouter();
  const { portfolio, loading: portfolioLoading } = usePMData();
  const [submissionMap, setSubmissionMap] = useState<Record<string, Record<string, number | null>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portfolio.length === 0) return;

    const load = async () => {
      try {
        const result: Record<string, Record<string, number | null>> = {};
        await Promise.all(portfolio.map(async ({ company }) => {
          // No orderBy with where — sort in JS to avoid composite index requirement
          const snap = await getDocs(
            query(
              collection(db, 'submissions'),
              where('companyId', '==', company.id),
              where('status', '==', 'scored'),
            )
          );
          const sorted = snap.docs
            .map(d => d.data())
            .sort((a, b) =>
              (b.scoredAt ?? b.submittedAt ?? '').localeCompare(a.scoredAt ?? a.submittedAt ?? '')
            );
          result[company.id] = sorted.length > 0 ? (sorted[0].data || {}) : {};
        }));
        setSubmissionMap(result);
      } catch (err) {
        console.error('Completeness load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolio]);

  const companyCompleteness = useMemo(() => {
    return portfolio.map(({ company }) => {
      const data    = submissionMap[company.id] || {};
      const allKPIs = KPI_DISPLAY_LIST;
      const reported = allKPIs.filter(k => data[k.id] != null).length;
      const pct      = allKPIs.length > 0 ? Math.round((reported / allKPIs.length) * 100) : 0;

      const categoryScores = Object.entries(KPI_CATEGORIES).map(([cat, kpis]) => ({
        category: cat,
        reported: kpis.filter(k => data[k.id] != null).length,
        total:    kpis.length,
        pct:      kpis.length > 0
          ? Math.round(kpis.filter(k => data[k.id] != null).length / kpis.length * 100)
          : 0,
      }));

      return { company, data, reported, total: allKPIs.length, pct, categoryScores };
    }).sort((a, b) => a.pct - b.pct);
  }, [portfolio, submissionMap]);

  const kpiGaps = useMemo(() => {
    return KPI_DISPLAY_LIST.map(kpi => {
      const reported = portfolio.filter(({ company }) =>
        submissionMap[company.id]?.[kpi.id] != null
      ).length;
      return {
        kpi,
        reported,
        total: portfolio.length,
        pct:   portfolio.length > 0 ? Math.round(reported / portfolio.length * 100) : 0,
      };
    })
      .filter(k => k.pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 10);
  }, [portfolio, submissionMap]);

  const avgCompleteness = companyCompleteness.length > 0
    ? Math.round(companyCompleteness.reduce((s, c) => s + c.pct, 0) / companyCompleteness.length)
    : 0;

  if (portfolioLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-24" />)}
      </div>
    );
  }

  const completenessColor = (n: number) =>
    n >= 70 ? '#00A651' : n >= 40 ? '#E8A020' : '#D0021B';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Portfolio average completeness:{' '}
          <strong style={{ color: completenessColor(avgCompleteness) }}>
            {avgCompleteness}%
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Missing data shows as "Not yet reported" to SMEs
        </span>
      </PageContext>

      {/* Most commonly unreported KPIs */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Most commonly unreported KPIs
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          These fields are missing from the most companies — prioritise collecting these first
        </p>
        <div className="space-y-3">
          {kpiGaps.map((gap, idx) => (
            <div key={gap.kpi.id} className="animate-card-in" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {gap.kpi.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {gap.reported}/{gap.total} companies
                </span>
              </div>
              <AnimatedProgressBar
                value={gap.pct}
                color={completenessColor(gap.pct)}
                height={6}
                delay={idx * 30}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Per-company completeness */}
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Completeness by company
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Sorted least complete first — these need the most attention
        </p>
        <div className="space-y-3">
          {companyCompleteness.map(({ company, pct, categoryScores }, idx) => (
            <button
              key={company.id}
              onClick={() => router.push(`/company/${company.id}`)}
              className="card card-interactive w-full text-left p-4 animate-card-in"
              style={{ background: 'var(--surface)', animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--sanlam-navy)' }}
                  >
                    {company.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {company.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {company.sector.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-xl" style={{ color: completenessColor(pct) }}>
                    {pct}%
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>complete</p>
                </div>
              </div>

              {/* Category mini bars */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {categoryScores.map(cs => (
                  <div key={cs.category} className="text-center">
                    <p className="text-[10px] mb-1 capitalize" style={{ color: 'var(--text-muted)' }}>
                      {cs.category}
                    </p>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cs.pct}%`, background: CAT_COLORS[cs.category] }}
                      />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: CAT_COLORS[cs.category] }}>
                      {cs.pct}%
                    </p>
                  </div>
                ))}
              </div>

              <AnimatedProgressBar
                value={pct}
                color={completenessColor(pct)}
                height={4}
                delay={idx * 40}
              />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
