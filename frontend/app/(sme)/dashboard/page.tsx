'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, AlertTriangle, Award, CheckCircle } from 'lucide-react';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';
import { SDG_LIST, CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/sdg';
import { SkeletonDashboard } from '@/components/shared/Skeleton';
import AnimatedScore from '@/components/shared/AnimatedScore';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';

function ScoreDots({ score }: { score: number }) {
  const level = score >= 2.4 ? 3 : score >= 1.6 ? 2 : 1;
  const color = score >= 2.4 ? '#00A651' : score >= 1.6 ? '#E8A020' : '#D0021B';
  return (
    <div className="flex gap-1 justify-center mt-1">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? color : 'var(--border, #DDE3EC)' }}
        />
      ))}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

function formatSector(sector: string): string {
  return sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function SMEDashboardPage() {
  const router = useRouter();
  const { company, scorecard, loading, error } = useSMEData();

  if (loading) return <SkeletonDashboard />;

  if (error || !scorecard || !company) {
    return (
      <EmptyState
        icon="📊"
        title="No scorecard data yet"
        description="Your SDG scores will appear here once your first submission has been processed."
        action={
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00B5ED] text-white text-sm font-semibold hover:bg-[#0099CC] transition mx-auto"
            onClick={() => router.push('/submit')}
          >
            Submit your data
          </button>
        }
      />
    );
  }

  const { overallScore, classification, sdgScores, submissionPeriod, calculatedAt } = scorecard;
  const scoreMap    = new Map(sdgScores.map(s => [s.sdgId, s]));
  const highCount   = sdgScores.filter(s => s.classification === 'High').length;
  const lowCount    = sdgScores.filter(s => s.classification === 'Low').length;
  const classColors = CLASSIFICATION_COLORS[classification];

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>
          Reporting period:{' '}
          <strong style={{ color: 'var(--text-primary, #015376)' }}>
            {submissionPeriod}
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>
          Last updated:{' '}
          <strong style={{ color: 'var(--text-primary, #015376)' }}>
            {formatDate(calculatedAt)}
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--sanlam-green, #00A651)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--sanlam-green, #00A651)' }}
          />
          Scores live
        </span>
      </PageContext>

      {/* Overall Score Hero */}
      <div
        className="rounded-xl border p-7 animate-card-in delay-50"
        style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted, #4A5568)' }}>
              Overall SDG Score
            </p>
            <div className="flex items-end gap-4 mb-3">
              <AnimatedScore
                value={overallScore}
                className="text-6xl font-bold leading-none"
                style={{ color: scoreColor(overallScore) }}
              />
              <span
                className="mb-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                style={{
                  background: classColors.bg,
                  color:      classColors.text,
                  border:     `1px solid ${classColors.border}`,
                }}
              >
                {CLASSIFICATION_LABELS[classification]}
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted, #4A5568)' }}>
              out of 3.0 maximum
            </p>
            <div className="w-full max-w-xs">
              <AnimatedProgressBar
                value={((overallScore - 1) / 2) * 100}
                color={scoreColor(overallScore)}
                height={8}
                delay={400}
              />
            </div>
          </div>

          <div className="text-right space-y-4 ml-8">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>Scoring period</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary, #015376)' }}>
                {submissionPeriod}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>Sector</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary, #015376)' }}>
                {formatSector(company.sector)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>SDGs assessed</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary, #015376)' }}>
                {sdgScores.length} of 17
              </p>
            </div>
            <button
              onClick={() => router.push('/scorecard')}
              className="text-[#00B5ED] text-sm hover:underline"
            >
              View full scorecard →
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,    iconColor: '#00A651', value: String(highCount),  label: 'High Impact SDGs',  sub: 'Performing well',       subColor: '#00A651', delay: 'delay-100' },
          { icon: AlertTriangle, iconColor: '#E8A020', value: String(lowCount),   label: 'Needs Attention',   sub: 'Below sector average',  subColor: '#E8A020', delay: 'delay-150' },
          { icon: Award,         iconColor: '#00B5ED', value: 'Top 40%',          label: 'Sector Rank',       sub: 'vs. peer companies',    subColor: '#00B5ED', delay: 'delay-200' },
          { icon: CheckCircle,   iconColor: '#00A651', value: 'Complete',         label: 'Data Submission',   sub: `${submissionPeriod} submitted`, subColor: '#00A651', delay: 'delay-250' },
        ].map(({ icon: Icon, iconColor, value, label, sub, subColor, delay }) => (
          <div
            key={label}
            className={`rounded-xl border p-5 animate-card-in ${delay}`}
            style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}
          >
            <Icon size={20} style={{ color: iconColor }} className="mb-3" />
            <p className="font-bold text-xl mb-0.5" style={{ color: 'var(--text-primary, #015376)' }}>
              {value}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted, #4A5568)' }}>{label}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {lowCount > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-5 py-4"
          style={{
            background: '#FEF9C3',
            border:     '1px solid #FDE047',
            borderLeft: '4px solid #E8A020',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} style={{ color: '#E8A020' }} className="flex-shrink-0" />
            <p className="text-sm" style={{ color: '#854D0E' }}>
              You have <strong>{lowCount}</strong> SDG goal{lowCount > 1 ? 's' : ''} that need
              attention. Review your scorecard and speak to your AI coach for improvement steps.
            </p>
          </div>
          <button
            onClick={() => router.push('/scorecard')}
            className="ml-4 text-sm font-medium px-3 py-1.5 rounded-lg border flex-shrink-0 hover:bg-amber-50 transition"
            style={{ borderColor: '#E8A020', color: '#854D0E' }}
          >
            View scorecard
          </button>
        </div>
      )}

      {/* SDG Mini-Grid */}
      <div>
        <div className="mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary, #015376)' }}>
            Your SDG Performance
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted, #4A5568)' }}>
            Tap any goal to see details
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
          {SDG_LIST.map((sdg, idx) => {
            const s = scoreMap.get(sdg.id);
            return (
              <button
                key={sdg.id}
                onClick={() => router.push('/scorecard')}
                className="rounded-[10px] border overflow-hidden text-center hover:shadow-md transition-all duration-150 cursor-pointer animate-card-in"
                style={{
                  background:      'var(--surface, #fff)',
                  borderColor:     'var(--border, #DDE3EC)',
                  animationDelay:  `${idx * 30}ms`,
                }}
              >
                <div className="h-1.5 w-full" style={{ background: sdg.color }} />
                <div className="px-2 pt-2 pb-2.5">
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted, #4A5568)' }}>
                    SDG {sdg.id}
                  </p>
                  <p className="text-base leading-none my-1">{sdg.icon}</p>
                  <p className="text-[10px] truncate leading-tight mb-1.5" style={{ color: 'var(--text-muted, #4A5568)' }}>
                    {sdg.shortName}
                  </p>
                  <div className="h-8 flex flex-col items-center justify-center">
                    {s ? (
                      <>
                        <p className="font-bold text-sm leading-none" style={{ color: scoreColor(s.score) }}>
                          {s.score.toFixed(1)}
                        </p>
                        <ScoreDots score={s.score} />
                      </>
                    ) : (
                      <p className="text-xs leading-none" style={{ color: 'var(--text-muted, #4A5568)', opacity: 0.5 }}>N/A</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
