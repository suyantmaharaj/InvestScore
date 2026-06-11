'use client';

import { useRouter } from 'next/navigation';
import { usePMData } from '@/hooks/usePMData';
import { usePortfolioEmployment } from '@/hooks/usePortfolioEmployment';
import { exportPortfolioPDF } from '@/lib/export-portfolio-pdf';
import { SkeletonCard } from '@/components/shared/Skeleton';
import AnimatedScore from '@/components/shared/AnimatedScore';
import PageContext from '@/components/shared/PageContext';
import Tooltip from '@/components/shared/Tooltip';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, delay, icon }: {
  label: string; value: string | number; sub?: string;
  color: string; delay?: string; icon: string;
}) {
  return (
    <div className={`card p-5 animate-card-in ${delay ?? ''}`} style={{ background: 'var(--surface)' }}>
      <p className="text-2xl mb-2">{icon}</p>
      <p className="font-bold text-2xl" style={{ color }}>
        {typeof value === 'number'
          ? <AnimatedScore value={value} raw decimals={0} style={{ color }} />
          : value}
      </p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-1 font-medium" style={{ color }}>{sub}</p>}
    </div>
  );
}

// ── Stacked bar ───────────────────────────────────────────────────────────────
function StackedBar({ segments }: {
  segments: { label: string; value: number; total: number; color: string }[];
}) {
  return (
    <div>
      <div className="w-full h-8 rounded-xl overflow-hidden flex" style={{ background: 'var(--border)' }}>
        {segments.map((s, i) => {
          const pct = s.total > 0 ? (s.value / s.total) * 100 : 0;
          return pct > 0 ? (
            <Tooltip key={i} content={`${s.label}: ${s.value.toLocaleString()} (${Math.round(pct)}%)`} position="top">
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: s.color, transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }}
              />
            </Tooltip>
          ) : null;
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {s.label}:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{s.value.toLocaleString()}</strong>
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}({s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PortfolioEmploymentPage() {
  const router = useRouter();
  const { portfolio, loading: portfolioLoading } = usePMData();
  const { employmentData, loading: empLoading }  = usePortfolioEmployment(portfolio);

  if (portfolioLoading || empLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  const {
    totalEmployees, blackEmployees, femaleEmployees, maleEmployees, youthEmployees,
    managementEmployees, contractorEmployees, staffEmployees,
    reportingCompanies, totalCompanies, byCompany,
  } = employmentData;

  const pct = (n: number) => totalEmployees > 0 ? Math.round(n / totalEmployees * 100) : 0;
  const blackPct  = pct(blackEmployees);
  const femalePct = pct(femaleEmployees);
  const youthPct  = pct(youthEmployees);
  const permPct   = pct(staffEmployees + managementEmployees);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Data from{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {reportingCompanies} of {totalCompanies}
          </strong>{' '}
          companies
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          104+ SMME Growth &amp; Empowerment Solution
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <button
          onClick={() => exportPortfolioPDF(employmentData, portfolio)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition pressable"
          style={{
            background: 'rgba(0,181,237,0.1)',
            color:      'var(--sanlam-teal)',
            border:     '1px solid rgba(0,181,237,0.2)',
          }}
        >
          Export PDF report
        </button>
      </PageContext>

      {/* Hero stat cards - mirrors 104+ report structure */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total employees" value={totalEmployees}
          color="#00B5ED" sub={`Across ${reportingCompanies} companies`} delay="delay-50" />
        <StatCard icon="✊" label="Black employees" value={`${blackPct}%`}
          color="#00B5ED" sub={`${blackEmployees.toLocaleString()} people`} delay="delay-100" />
        <StatCard icon="⚧" label="Female employees" value={`${femalePct}%`}
          color="#00A651" sub={`${femaleEmployees.toLocaleString()} of ${totalEmployees.toLocaleString()}`} delay="delay-150" />
        <StatCard icon="🎯" label="Youth employees" value={`${youthPct}%`}
          color="#E8A020" sub="Aged 35 and under" delay="delay-200" />
      </div>

      {/* Population group breakdown - mirrors 104+ report Section 4.2 */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Workforce by Population Group
          </p>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalEmployees.toLocaleString()} total employees
          </span>
        </div>
        <StackedBar segments={[
          { label: 'Black',    value: blackEmployees,              total: totalEmployees, color: '#00B5ED' },
          { label: 'Other',    value: Math.max(0, totalEmployees - blackEmployees - femaleEmployees + Math.min(femaleEmployees, blackEmployees)), total: totalEmployees, color: '#015376' },
          { label: 'Reported', value: Math.max(0, totalEmployees - blackEmployees), total: totalEmployees, color: '#C9EEFB' },
        ]} />
      </div>

      {/* Gender breakdown - mirrors 104+ report Section 4.3 */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Gender Distribution
        </p>
        <StackedBar segments={[
          { label: 'Female', value: femaleEmployees, total: totalEmployees, color: '#00A651' },
          { label: 'Male',   value: maleEmployees,   total: totalEmployees, color: '#00B5ED' },
        ]} />
      </div>

      {/* Employment type - mirrors 104+ report Section 4.4 */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Employment Type
        </p>
        <StackedBar segments={[
          { label: 'Staff',       value: staffEmployees,       total: totalEmployees, color: '#00B5ED' },
          { label: 'Management',  value: managementEmployees,  total: totalEmployees, color: '#015376' },
          { label: 'Contractors', value: contractorEmployees,  total: totalEmployees, color: '#E8A020' },
        ]} />
        <div
          className="mt-4 pt-4 grid grid-cols-3 gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {[
            { label: 'Permanent rate',           value: `${permPct}%`,                                         color: '#00A651' },
            { label: 'Management representation', value: `${pct(managementEmployees)}%`,                       color: '#00B5ED' },
            { label: 'Contract labour rate',      value: `${pct(contractorEmployees)}%`,                       color: '#E8A020' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
              <p className="font-bold text-xl" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-company breakdown table */}
      <div className="card" style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Employment by Company
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Click to view full profile
          </p>
        </div>

        {/* Table header */}
        <div
          className="grid px-5 py-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            color:      'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
            background:   'var(--bg)',
          }}
        >
          <span>Company</span>
          <span className="text-center">Total</span>
          <span className="text-center">Black %</span>
          <span className="text-center">Female %</span>
          <span className="text-center">Youth %</span>
          <span className="text-center">Perm %</span>
        </div>

        {byCompany.map((row, idx) => (
          <button
            key={row.companyId}
            onClick={() => router.push(`/company/${row.companyId}`)}
            className="w-full grid px-5 py-3 text-sm text-left animate-card-in pressable"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
              borderBottom: idx < byCompany.length - 1 ? '1px solid var(--border)' : 'none',
              animationDelay: `${idx * 30}ms`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                style={{ background: 'var(--sanlam-navy)' }}
              >
                {row.companyName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
              </div>
              <span className="truncate text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {row.companyName}
              </span>
            </div>

            <span className="text-center text-xs" style={{ color: 'var(--text-primary)' }}>
              {row.totalEmployees != null
                ? row.totalEmployees.toLocaleString()
                : <span style={{ color: 'var(--text-muted)' }}>-</span>}
            </span>

            {([
              { val: row.blackPct,  thresh: 60 },
              { val: row.femalePct, thresh: 30 },
              { val: row.youthPct,  thresh: 30 },
              { val: row.permPct,   thresh: 70 },
            ] as const).map(({ val, thresh }, i) => (
              <span
                key={i}
                className="text-center text-xs font-semibold"
                style={{
                  color: val == null
                    ? 'var(--text-muted)'
                    : val >= thresh ? '#00A651' : val >= thresh * 0.6 ? '#E8A020' : '#D0021B',
                }}
              >
                {val != null ? `${val}%` : '-'}
              </span>
            ))}
          </button>
        ))}

        {/* Totals row */}
        <div
          className="grid px-5 py-3 text-sm font-semibold"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            borderTop: '2px solid var(--border)',
            background: 'var(--bg)',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Portfolio total</span>
          <span className="text-center" style={{ color: 'var(--text-primary)' }}>
            {totalEmployees.toLocaleString()}
          </span>
          <span className="text-center" style={{ color: '#00B5ED' }}>{blackPct}%</span>
          <span className="text-center" style={{ color: '#00A651' }}>{femalePct}%</span>
          <span className="text-center" style={{ color: '#E8A020' }}>{youthPct}%</span>
          <span className="text-center" style={{ color: '#00A651' }}>{permPct}%</span>
        </div>
      </div>

    </div>
  );
}
