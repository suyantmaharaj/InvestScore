'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, AlertTriangle, Award, CheckCircle } from 'lucide-react';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';
import { SDG_LIST, CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from '@/lib/sdg';

function ScoreDots({ score }: { score: number }) {
  const level = score >= 2.4 ? 3 : score >= 1.6 ? 2 : 1;
  const color = score >= 2.4 ? '#00A651' : score >= 1.6 ? '#E8A020' : '#D0021B';
  return (
    <div className="flex gap-1 justify-center mt-1">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? color : '#DDE3EC' }}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#00B5ED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !scorecard || !company) {
    return (
      <div className="flex items-center justify-center h-64 text-[#4A5568]">
        <p>Unable to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const { overallScore, classification, sdgScores, submissionPeriod, calculatedAt } = scorecard;
  const scoreMap   = new Map(sdgScores.map(s => [s.sdgId, s]));
  const highCount  = sdgScores.filter(s => s.classification === 'High').length;
  const lowCount   = sdgScores.filter(s => s.classification === 'Low').length;
  const classColors = CLASSIFICATION_COLORS[classification];

  return (
    <div className="max-w-6xl mx-auto space-y-7">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[#015376] font-semibold text-xl">{company.name}</h1>
          <p className="text-[#4A5568] text-sm mt-0.5">
            {formatSector(company.sector)} · {company.location}
          </p>
        </div>
        <div className="text-right">
          <span className="bg-[#00B5ED] text-white text-xs font-medium px-3 py-1 rounded-full">
            {submissionPeriod}
          </span>
          <p className="text-[#4A5568]/60 text-xs mt-1.5">
            Last updated: {formatDate(calculatedAt)}
          </p>
        </div>
      </div>

      {/* Overall Score Hero */}
      <div className="bg-white rounded-xl border border-[#DDE3EC] p-7">
        <div className="flex items-start justify-between">

          {/* Left */}
          <div className="flex-1">
            <p className="text-[#4A5568] text-xs uppercase tracking-widest mb-2">
              Overall SDG Score
            </p>
            <div className="flex items-end gap-4 mb-3">
              <span
                className="text-6xl font-bold leading-none"
                style={{ color: scoreColor(overallScore) }}
              >
                {overallScore.toFixed(1)}
              </span>
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
            <p className="text-[#4A5568] text-sm mb-4">out of 3.0 maximum</p>
            {/* Progress bar — scaled from 1–3 range */}
            <div className="w-full max-w-xs h-2 rounded-full bg-[#DDE3EC] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${((overallScore - 1) / 2) * 100}%`,
                  background: scoreColor(overallScore),
                }}
              />
            </div>
          </div>

          {/* Right */}
          <div className="text-right space-y-4 ml-8">
            <div>
              <p className="text-[#4A5568] text-xs">Scoring period</p>
              <p className="text-[#015376] font-semibold text-sm">{submissionPeriod}</p>
            </div>
            <div>
              <p className="text-[#4A5568] text-xs">Sector</p>
              <p className="text-[#015376] font-semibold text-sm">{formatSector(company.sector)}</p>
            </div>
            <div>
              <p className="text-[#4A5568] text-xs">SDGs assessed</p>
              <p className="text-[#015376] font-semibold text-sm">{sdgScores.length} of 17</p>
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
          {
            icon: TrendingUp,
            iconColor: '#00A651',
            value: String(highCount),
            label: 'High Impact SDGs',
            sub: 'Performing well',
            subColor: '#00A651',
          },
          {
            icon: AlertTriangle,
            iconColor: '#E8A020',
            value: String(lowCount),
            label: 'Needs Attention',
            sub: 'Below sector average',
            subColor: '#E8A020',
          },
          {
            icon: Award,
            iconColor: '#00B5ED',
            value: 'Top 40%',
            label: 'Sector Rank',
            sub: 'vs. peer companies',
            subColor: '#00B5ED',
          },
          {
            icon: CheckCircle,
            iconColor: '#00A651',
            value: 'Complete',
            label: 'Data Submission',
            sub: `${submissionPeriod} submitted`,
            subColor: '#00A651',
          },
        ].map(({ icon: Icon, iconColor, value, label, sub, subColor }) => (
          <div key={label} className="bg-white rounded-xl border border-[#DDE3EC] p-5">
            <Icon size={20} style={{ color: iconColor }} className="mb-3" />
            <p className="text-[#015376] font-bold text-xl mb-0.5">{value}</p>
            <p className="text-[#4A5568] text-sm">{label}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Alert banner — only shown when Low SDGs exist */}
      {lowCount > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-5 py-4"
          style={{
            background:  '#FEF9C3',
            border:      '1px solid #FDE047',
            borderLeft:  '4px solid #E8A020',
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
          <h2 className="text-[#015376] font-semibold text-base">Your SDG Performance</h2>
          <p className="text-[#4A5568] text-sm mt-0.5">Tap any goal to see details</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9 gap-2">
          {SDG_LIST.map(sdg => {
            const s = scoreMap.get(sdg.id);
            return (
              <button
                key={sdg.id}
                onClick={() => router.push('/scorecard')}
                className="bg-white border border-[#DDE3EC] rounded-[10px] overflow-hidden text-center hover:shadow-md hover:border-[#00B5ED] transition-all duration-150 cursor-pointer"
              >
                {/* SDG color strip */}
                <div className="h-1.5 w-full" style={{ background: sdg.color }} />
                <div className="px-2 pt-2 pb-2.5">
                  <p className="text-[#4A5568] text-[10px] font-medium">SDG {sdg.id}</p>
                  <p className="text-base leading-none my-1">{sdg.icon}</p>
                  <p className="text-[#4A5568] text-[10px] truncate leading-tight mb-1.5">
                    {sdg.shortName}
                  </p>
                  {s ? (
                    <>
                      <p
                        className="font-bold text-sm leading-none"
                        style={{ color: scoreColor(s.score) }}
                      >
                        {s.score.toFixed(1)}
                      </p>
                      <ScoreDots score={s.score} />
                    </>
                  ) : (
                    <p className="text-[#4A5568]/50 text-xs leading-none">N/A</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
