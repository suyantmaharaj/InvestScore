'use client';

import { PULSE_HIGHLIGHTS, PORTFOLIO_PULSE } from '@/lib/portfolio-pulse';

export default function PortfolioPulse() {
  return (
    <div
      className="card p-5"
      style={{ background: 'var(--sanlam-navy)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-sm text-white">
            104+ Portfolio — Live Impact
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            You are one of {PORTFOLIO_PULSE.activeCompanies} companies
            driving this impact · {PORTFOLIO_PULSE.reportingPeriod}
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: 'rgba(0,181,237,0.2)', color: '#7DD3FC' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#7DD3FC' }}
          />
          Live data
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PULSE_HIGHLIGHTS.map((h, i) => (
          <div
            key={h.label}
            className="rounded-xl p-3 text-center animate-card-in"
            style={{
              background:     'rgba(255,255,255,0.06)',
              border:         '1px solid rgba(255,255,255,0.08)',
              animationDelay: `${i * 60}ms`,
            }}
          >
            <p className="text-base mb-1">{h.icon}</p>
            <p className="font-bold text-lg text-white leading-tight">{h.value}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {h.unit}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {h.label}
            </p>
          </div>
        ))}
      </div>

      <p
        className="text-xs text-center mt-4 italic"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        "{PORTFOLIO_PULSE.permanentJobsPct}% of portfolio jobs are permanent roles.
        {' '}{PORTFOLIO_PULSE.youthEmployeePct}% of the workforce is youth under 35."
      </p>
    </div>
  );
}
