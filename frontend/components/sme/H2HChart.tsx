'use client';

import { BenchmarkSDGRow } from '@/hooks/useBenchmarkData';

interface Props {
  rows:        BenchmarkSDGRow[];
  compareMode: 'sector_avg' | 'top_quartile' | 'bottom_quartile';
}

function scoreColor(score: number): string {
  if (score >= 2.4) return '#00A651';
  if (score >= 1.6) return '#E8A020';
  return '#D0021B';
}

const barPct = (score: number) => ((score - 1) / 2) * 100;

export default function H2HChart({ rows, compareMode }: Props) {
  const scoredRows = rows.filter(r => r.myScore !== null);

  const compareScore = (row: BenchmarkSDGRow): number => {
    if (compareMode === 'top_quartile')    return row.topQuartile;
    if (compareMode === 'bottom_quartile') return row.bottomQuartile;
    return row.sectorAvg;
  };

  const compareLabel = {
    sector_avg:      'Sector Average',
    top_quartile:    'Top Quartile',
    bottom_quartile: 'Bottom Quartile',
  }[compareMode];

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-3 px-1">
        <p className="text-xs font-semibold text-[#00B5ED] text-right pr-2">You</p>
        <p className="text-xs text-[#4A5568] w-16 text-center">SDG</p>
        <p className="text-xs font-semibold text-[#015376] text-left pl-2">{compareLabel}</p>
      </div>

      <div className="space-y-2">
        {scoredRows.map(row => {
          const myPct      = barPct(row.myScore!);
          const comparePct = barPct(compareScore(row));
          const myC        = scoreColor(row.myScore!);
          const diff       = row.myScore! - compareScore(row);

          return (
            <div key={row.sdgId} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

              {/* Left bar — my score, grows right to left */}
              <div className="flex items-center justify-end gap-2">
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: myC, minWidth: '28px', textAlign: 'right' }}
                >
                  {row.myScore!.toFixed(1)}
                </span>
                <div
                  className="flex-1 h-5 rounded-l-full overflow-hidden flex justify-end max-w-[140px]"
                  style={{ background: 'rgba(221,227,236,0.4)' }}
                >
                  <div
                    className="h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${myPct}%`, background: myC, opacity: 0.85 }}
                  />
                </div>
              </div>

              {/* Centre — SDG label + indicator */}
              <div className="flex flex-col items-center w-16">
                <span className="text-[10px] font-bold" style={{ color: row.sdgColor }}>
                  {row.sdgIcon}
                </span>
                <span className="text-[9px] text-[#4A5568] font-medium">SDG {row.sdgId}</span>
                <span
                  className="text-[9px] font-bold mt-0.5"
                  style={{
                    color: diff > 0.05 ? '#00A651' : diff < -0.05 ? '#D0021B' : '#4A5568',
                  }}
                >
                  {diff > 0.05 ? '▲' : diff < -0.05 ? '▼' : '='}
                </span>
              </div>

              {/* Right bar — compare score, grows left to right */}
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 h-5 rounded-r-full overflow-hidden max-w-[140px]"
                  style={{ background: 'rgba(221,227,236,0.4)' }}
                >
                  <div
                    className="h-full rounded-r-full transition-all duration-500"
                    style={{ width: `${comparePct}%`, background: '#015376', opacity: 0.6 }}
                  />
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0 text-[#015376]"
                  style={{ minWidth: '28px' }}
                >
                  {compareScore(row).toFixed(1)}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#DDE3EC]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded-full bg-[#00B5ED]" style={{ opacity: 0.85 }} />
          <span className="text-xs text-[#4A5568]">Your score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded-full bg-[#015376]" style={{ opacity: 0.6 }} />
          <span className="text-xs text-[#4A5568]">{compareLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#4A5568]">
          <span className="text-green-600 font-bold">▲ Above</span>
          <span className="text-red-500 font-bold">▼ Below</span>
          <span className="font-bold">= Equal</span>
        </div>
      </div>
    </div>
  );
}
