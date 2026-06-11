'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonBenchmark } from '@/components/shared/Skeleton';
import { Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toDisplay } from '@/lib/score';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import SDGRadarChart from '@/components/sme/SDGRadarChart';
import H2HChart from '@/components/sme/H2HChart';
import PageContext from '@/components/shared/PageContext';

type ViewMode    = 'radar' | 'h2h';
type CompareMode = 'sector_avg' | 'top_quartile' | 'bottom_quartile';

function formatSector(sector: string): string {
  return sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function overallColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

export default function BenchmarkingPage() {
  const router = useRouter();
  const { data, loading, error } = useBenchmarkData();

  const [viewMode,    setViewMode]    = useState<ViewMode>('h2h');
  const [compareMode, setCompareMode] = useState<CompareMode>('sector_avg');

  if (loading) return <SkeletonBenchmark />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted, #4A5568)' }}>
        <p>Unable to load benchmarking data. Please try again.</p>
      </div>
    );
  }

  const overallDiff = data.myOverall - data.sectorAvgOverall;
  const vsTop       = data.myOverall - data.topQuartileOverall;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>
          Sector:{' '}
          <strong style={{ color: 'var(--text-primary, #015376)' }}>
            {formatSector(data.sector)}
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted, #4A5568)' }}>
          Comparing against{' '}
          <strong style={{ color: 'var(--text-primary, #015376)' }}>
            {data.totalPeers} peer companies
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal, #00B5ED)' }}
        >
          Anonymous · Confidential
        </span>
      </PageContext>

      {/* Top-level comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="rounded-xl border p-5" style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}>
          <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-2">Your Overall Score</p>
          <p className="text-4xl font-bold mb-1" style={{ color: overallColor(data.myOverall) }}>
            {toDisplay(data.myOverall)}
          </p>
          <p className="text-[#4A5568] text-xs">out of 100</p>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}>
          <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-2">vs Sector Average</p>
          <div className="flex items-end gap-2 mb-1">
            <p className="text-4xl font-bold text-[#015376]">{toDisplay(data.sectorAvgOverall)}</p>
            <div
              className="flex items-center gap-1 mb-1 text-sm font-semibold"
              style={{ color: overallDiff >= 0 ? '#00A651' : '#D0021B' }}
            >
              {overallDiff >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {overallDiff >= 0 ? '+' : ''}{toDisplay(data.myOverall) - toDisplay(data.sectorAvgOverall)}
            </div>
          </div>
          <p className="text-[#4A5568] text-xs">
            {overallDiff >= 0.05
              ? 'You are above sector average'
              : overallDiff <= -0.05
              ? 'You are below sector average'
              : 'You are at sector average'}
          </p>
        </div>

        <div className="rounded-xl border p-5" style={{ background: 'var(--surface, #fff)', borderColor: 'var(--border, #DDE3EC)' }}>
          <p className="text-[#4A5568] text-xs uppercase tracking-wider mb-2">vs Top Quartile</p>
          <div className="flex items-end gap-2 mb-1">
            <p className="text-4xl font-bold text-[#015376]">{toDisplay(data.topQuartileOverall)}</p>
            <div
              className="flex items-center gap-1 mb-1 text-sm font-semibold"
              style={{ color: vsTop >= 0 ? '#00A651' : '#D0021B' }}
            >
              {vsTop >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {vsTop >= 0 ? '+' : ''}{toDisplay(data.myOverall) - toDisplay(data.topQuartileOverall)}
            </div>
          </div>
          <p className="text-[#4A5568] text-xs">
            {vsTop >= 0
              ? 'You are in the top quartile'
              : `${Math.abs(toDisplay(data.myOverall) - toDisplay(data.topQuartileOverall))} pts below top quartile`}
          </p>
        </div>

      </div>

      {/* Privacy notice */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
        style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1' }}
      >
        <Users size={15} className="flex-shrink-0" />
        <p>
          Peer identities are always anonymous. You are compared against aggregated sector
          data only. No individual company names or data are shown.
        </p>
      </div>

      {/* Chart panel */}
      <div className="bg-white rounded-xl border border-[#DDE3EC] p-5">

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

          {/* View mode toggle */}
          <div className="flex gap-1 p-1 bg-[#F4F6F8] rounded-lg">
            {([
              { key: 'h2h',   label: 'Head to Head' },
              { key: 'radar', label: 'Radar View'   },
            ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className="px-4 py-2 text-sm font-medium rounded-md pressable"
                style={{
                  background: viewMode === key ? '#015376' : 'transparent',
                  color:      viewMode === key ? 'white'   : '#4A5568',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* H2H compare mode */}
          {viewMode === 'h2h' && (
            <div className="flex gap-1.5">
              {([
                { key: 'sector_avg',      label: 'Sector Avg' },
                { key: 'top_quartile',    label: 'Top 25%'    },
                { key: 'bottom_quartile', label: 'Bottom 25%' },
              ] as { key: CompareMode; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCompareMode(key)}
                  className="px-3 py-1.5 text-xs rounded-lg border font-medium pressable"
                  style={{
                    background:  compareMode === key ? '#00B5ED' : 'white',
                    color:       compareMode === key ? 'white'   : '#4A5568',
                    borderColor: compareMode === key ? '#00B5ED' : '#DDE3EC',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Radar legend */}
          {viewMode === 'radar' && (
            <div className="flex items-center gap-4 text-xs text-[#4A5568]">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-[#00B5ED] rounded" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 rounded" style={{ background: '#015376', opacity: 0.5 }} />
                <span>Sector Avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 border-t border-dashed" style={{ borderColor: 'rgba(0,181,237,0.5)' }} />
                <span>Top Quartile</span>
              </div>
            </div>
          )}

        </div>

        {/* Chart */}
        {viewMode === 'radar' ? (
          <SDGRadarChart rows={data.rows} size={420} />
        ) : (
          <H2HChart rows={data.rows} compareMode={compareMode} />
        )}

      </div>

      {/* SDG comparison table */}
      <div className="bg-white rounded-xl border border-[#DDE3EC] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDE3EC]">
          <h2 className="text-[#015376] font-semibold text-sm">SDG Comparison Summary</h2>
          <p className="text-[#4A5568] text-xs mt-0.5">Your score vs sector average for each goal</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDE3EC] bg-[#F4F6F8]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#4A5568]">SDG</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#00B5ED]">Your Score</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#4A5568]">Sector Avg</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#4A5568]">Top 25%</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-[#4A5568]">vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => {
                const diff     = (row.myScore ?? 0) - row.sectorAvg;
                const hasScore = row.myScore !== null;
                return (
                  <tr
                    key={row.sdgId}
                    className="border-b border-[#DDE3EC]/50 hover:bg-[#F4F6F8]/50 transition"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: row.sdgColor }}
                        />
                        <span className="text-[#4A5568] text-xs font-medium">SDG {row.sdgId}</span>
                        <span className="text-[#015376] text-xs hidden sm:inline">
                          {row.sdgShortName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasScore ? (
                        <span className="font-bold text-sm" style={{ color: overallColor(row.myScore!) }}>
                          {toDisplay(row.myScore!)}
                        </span>
                      ) : (
                        <span className="text-[#4A5568]/50 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#015376] text-sm">
                      {toDisplay(row.sectorAvg)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#4A5568] text-sm">
                      {toDisplay(row.topQuartile)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {hasScore ? (
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: diff > 0.05 ? '#00A651' : diff < -0.05 ? '#D0021B' : '#4A5568',
                          }}
                        >
                          {(() => { const d = toDisplay(row.myScore!) - toDisplay(row.sectorAvg); return (d > 0 ? '+' : '') + d; })()}
                        </span>
                      ) : (
                        <span className="text-[#4A5568]/40 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl p-6 flex items-center justify-between" style={{ background: '#015376' }}>
        <div>
          <p className="text-white font-semibold text-base mb-1">Want to improve your ranking?</p>
          <p className="text-white/70 text-sm">
            Chase can give you a personalised action plan to move up the rankings.
          </p>
        </div>
        <button
          onClick={() => router.push('/coach')}
          className="flex-shrink-0 ml-6 px-5 py-2.5 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] pressable"
        >
          Talk to Chase →
        </button>
      </div>

    </div>
  );
}
