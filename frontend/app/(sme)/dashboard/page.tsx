'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getCached, setCached } from '@/lib/queryClient';
import { TrendingUp, AlertTriangle, Award, CheckCircle } from 'lucide-react';
import SDGIcon from '@/components/sdg/SDGIcon';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';
import { db } from '@/lib/firebase';
import { SDG_LIST, CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/sdg';
import { toDisplay } from '@/lib/score';
import { SkeletonDashboard } from '@/components/shared/Skeleton';
import AnimatedScore from '@/components/shared/AnimatedScore';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';
import SectorContext from '@/components/sme/SectorContext';
import QuarterlyReminder from '@/components/sme/QuarterlyReminder';
import CourseBadges from '@/components/sme/CourseBadges';
import InvestmentContext from '@/components/sme/InvestmentContext';
import PortfolioPulse from '@/components/sme/PortfolioPulse';

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
  const [lastSubmissionDate, setLastSubmissionDate] = useState<string | null>(null);
  const [lastSubmissionData, setLastSubmissionData] = useState<Record<string, number | null> | null>(null);
  const [targets, setTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!company?.id) return;
    const load = async () => {
      const cacheKey = `targets_${company.id}`;
      const cached = getCached<Record<string, number>>(cacheKey);
      if (cached) { setTargets(cached); return; }
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/targets/${company.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        const targets = json.targets || {};
        setCached(cacheKey, targets);
        setTargets(targets);
      } catch { /* silent */ }
    };
    load();
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;

    const loadLastSubmission = async () => {
      const cacheKey = `last_submission_${company.id}`;
      const cached = getCached<{ date: string | null; data: Record<string, number | null> | null }>(cacheKey);
      if (cached) {
        setLastSubmissionDate(cached.date);
        setLastSubmissionData(cached.data);
        return;
      }
      try {
        const snap = await getDocs(
          query(
            collection(db, 'submissions'),
            where('companyId', '==', company.id),
            where('status', '==', 'scored')
          )
        );
        if (!snap.empty) {
          const d = snap.docs
            .map(docSnap => docSnap.data())
            .sort((a, b) => (b.scoredAt || b.submittedAt || '').localeCompare(a.scoredAt || a.submittedAt || ''))[0];
          const date = d.scoredAt || d.submittedAt || null;
          const data = d.data || null;
          setCached(cacheKey, { date, data });
          setLastSubmissionDate(date);
          setLastSubmissionData(data);
        }
      } catch (err) {
        console.error('Load last submission error:', err);
      }
    };

    loadLastSubmission();
  }, [company?.id]);

  if (loading) return <SkeletonDashboard />;

  if (error || !scorecard || !company) {
    return (
      <EmptyState
        icon="📊"
        title="No scorecard data yet"
        description="Your SDG scores will appear here once your first submission has been processed."
        action={
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00B5ED] text-white text-sm font-semibold hover:bg-[#0099CC] pressable mx-auto"
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
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">
      <QuarterlyReminder
        lastSubmissionDate={lastSubmissionDate}
        lastSubmissionData={lastSubmissionData}
      />

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
              <span className="mb-1.5 text-2xl font-bold leading-none" style={{ color: 'var(--text-muted)' }}>/100</span>
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
              out of 100
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

      {/* Investment context */}
      {scorecard && company && (
        <InvestmentContext
          overallScore={scorecard.overallScore}
          classification={scorecard.classification}
          mandate={company.mandate}
          bbbeeLevel={company.bbbeeLevel}
          companyName={company.name}
        />
      )}

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

      {/* Targets progress card */}
      {Object.keys(targets).length > 0 && (() => {
        const targetEntries = Object.entries(targets).map(([sdgId, t]) => {
          const score = sdgScores.find(s => String(s.sdgId) === sdgId);
          return { sdgId: Number(sdgId), target: t, actual: score ? toDisplay(score.score) : null };
        }).filter(e => e.actual !== null);
        if (targetEntries.length === 0) return null;
        const met  = targetEntries.filter(e => e.actual! >= e.target).length;
        const pct  = Math.round((met / targetEntries.length) * 100);
        return (
          <div
            className="rounded-xl border p-5 animate-card-in delay-300"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  PM Targets Progress
                </h2>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
                >
                  {met}/{targetEntries.length} met
                </span>
              </div>
              <button
                onClick={() => router.push('/scorecard')}
                className="text-xs font-medium"
                style={{ color: 'var(--sanlam-teal)' }}
              >
                View scorecard →
              </button>
            </div>
            <AnimatedProgressBar
              value={pct}
              color={pct >= 80 ? '#00A651' : pct >= 50 ? '#E8A020' : '#D0021B'}
              height={6}
              delay={300}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {pct}% of PM-set targets achieved across {targetEntries.length} SDG goal{targetEntries.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
              {targetEntries.map(({ sdgId, target, actual }) => {
                const sdg  = SDG_LIST.find(d => d.id === sdgId);
                const done = actual! >= target;
                const gap  = target - actual!;
                return (
                  <div
                    key={sdgId}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: 'var(--bg)', border: `1px solid ${done ? 'rgba(0,166,81,0.2)' : 'var(--border)'}` }}
                  >
                    {sdg ? <SDGIcon sdgId={sdg.id} size={20} /> : <span className="text-sm flex-shrink-0">🎯</span>}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>SDG {sdgId}</p>
                      <p className="text-[11px] font-bold" style={{ color: done ? '#00A651' : '#E8A020' }}>
                        {actual}/100 {done ? '✓' : `→${target}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <SectorContext />

      <CourseBadges />

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
                  <div className="flex justify-center my-1"><SDGIcon sdgId={sdg.id} size={24} /></div>
                  <p className="text-[10px] truncate leading-tight mb-1.5" style={{ color: 'var(--text-muted, #4A5568)' }}>
                    {sdg.shortName}
                  </p>
                  <div className="h-8 flex flex-col items-center justify-center">
                    {s ? (
                      <>
                        <p className="font-bold text-sm leading-none" style={{ color: scoreColor(s.score) }}>
                          {toDisplay(s.score)}
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

      <PortfolioPulse />

    </div>
  );
}
