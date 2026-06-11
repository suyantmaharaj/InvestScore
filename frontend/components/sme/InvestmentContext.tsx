'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import Tooltip from '@/components/shared/Tooltip';

interface Props {
  overallScore:   number;
  classification: 'Low' | 'Medium' | 'High';
  mandate?:       string;
  bbbeeLevel?:    number;
  companyName:    string;
}

const MANDATE_CONTEXT = {
  Growth: {
    label:    'Growth Mandate',
    color:    '#00B5ED',
    bg:       'rgba(0,181,237,0.08)',
    turnover: 'R50m – R200m annual turnover',
    focus:    'High employment potential and proven track record. No B-BBEE restriction.',
    scoreContext: {
      High:   'Your High Impact score puts you in the top tier of the Growth portfolio. This strengthens your case for continued and expanded investment.',
      Medium: 'Your Medium Impact score is solid. Maintaining consistent quarterly submissions and pushing one or two Low goals to Medium will strengthen your investment standing.',
      Low:    'Your Low Impact score suggests areas for improvement. Your Portfolio Manager will work with you to address this. Review the targets they have set and use the improvement plan.',
    },
  },
  Empowerment: {
    label:    'Empowerment Mandate',
    color:    '#00A651',
    bg:       'rgba(0,166,81,0.08)',
    turnover: 'Up to R50m annual turnover · 51%+ Black ownership required',
    focus:    'Economic transformation and inclusive hiring. B-BBEE compliance is a core criterion.',
    scoreContext: {
      High:   'Your High Impact score is exceptional for an Empowerment mandate company. You are demonstrating exactly the transformation outcomes Sanlam seeks to support.',
      Medium: 'Your Medium Impact score shows solid progress. Focus on your transformation metrics (B-BBEE level and Black ownership) as these carry additional weight in your mandate assessment.',
      Low:    'Your Low Impact score needs attention. For Empowerment mandate companies, transformation metrics are a primary lens. Your Portfolio Manager has set targets to guide you.',
    },
  },
  Development: {
    label:    'Development Mandate',
    color:    '#E8A020',
    bg:       'rgba(232,160,32,0.08)',
    turnover: 'Below R1m annual turnover · Black women or youth ownership',
    focus:    'Early-stage micro-enterprises building foundational sustainability practices.',
    scoreContext: {
      High:   'Exceptional performance for a Development mandate company. Your data quality and impact metrics are a model for early-stage businesses.',
      Medium: 'Good progress for an early-stage business. Continue submitting data quarterly to build a track record that strengthens your investment case.',
      Low:    'This is early stage. A Low score at this point is normal and expected. Focus on collecting the data and submitting consistently. The score will improve as your business grows.',
    },
  },
};

const SCORE_STANDING = {
  High:   { icon: TrendingUp,   color: '#00A651', label: 'Strong standing',    desc: 'Your score is in the High Impact range. This is the target for all companies in the 104+ portfolio.' },
  Medium: { icon: Minus,        color: '#E8A020', label: 'Good standing',       desc: 'Your score is in the Medium Impact range. Consistent improvement toward High Impact strengthens your investment case.' },
  Low:    { icon: TrendingDown, color: '#D0021B', label: 'Needs improvement',   desc: 'Your score is in the Low Impact range. Review your PM targets and improvement plan for a clear path forward.' },
};

export default function InvestmentContext({
  overallScore, classification, mandate, bbbeeLevel, companyName,
}: Props) {
  const router    = useRouter();
  const mKey      = (mandate || 'Growth') as keyof typeof MANDATE_CONTEXT;
  const mc        = MANDATE_CONTEXT[mKey] || MANDATE_CONTEXT.Growth;
  const standing  = SCORE_STANDING[classification];
  const StandingIcon = standing.icon;
  const scoreMsg  = mc.scoreContext[classification];

  return (
    <div
      className="card p-5"
      style={{ background: 'var(--surface)', borderLeft: `4px solid ${mc.color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: mc.bg, color: mc.color }}
            >
              {mc.label}
            </span>
            <Tooltip content="Your mandate determines how Sanlam assesses your impact investment" position="top">
              <Info size={13} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
            </Tooltip>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {mc.turnover}
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{ background: `${standing.color}12`, border: `1px solid ${standing.color}30` }}
        >
          <StandingIcon size={13} style={{ color: standing.color }} />
          <span className="text-xs font-semibold" style={{ color: standing.color }}>
            {standing.label}
          </span>
        </div>
      </div>

      {/* What this score means */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
          What your score means
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
          {scoreMsg}
        </p>
      </div>

      {/* Mandate focus */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Mandate focus:
        </span>{' '}
        {mc.focus}
      </p>

      {/* B-BBEE note for Empowerment */}
      {mKey === 'Empowerment' && bbbeeLevel && (
        <div
          className="mt-3 pt-3 flex items-center gap-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              background: bbbeeLevel <= 2 ? 'rgba(212,175,55,0.15)' : 'rgba(0,181,237,0.1)',
              color:      bbbeeLevel <= 2 ? '#B8860B'               : 'var(--sanlam-teal)',
            }}
          >
            B-BBEE Level {bbbeeLevel}
          </span>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {bbbeeLevel === 1 ? 'Excellent. Level 1 is the highest transformation rating'
              : bbbeeLevel === 2 ? 'Good. Level 2 reflects strong transformation commitment'
              : bbbeeLevel <= 4 ? 'Compliant. Consider a B-BBEE improvement plan to move up'
              : 'Below target. B-BBEE improvement is a priority for your mandate'}
          </p>
        </div>
      )}

      <button
        onClick={() => router.push('/scorecard')}
        className="mt-3 text-xs font-semibold hover:underline"
        style={{ color: mc.color }}
      >
        View full scorecard and improvement plan →
      </button>
    </div>
  );
}
