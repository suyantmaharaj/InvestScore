'use client';

import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { SDG_LIST } from '@/lib/sdg';

export default function SectorContext() {
  const { data, loading } = useBenchmarkData();

  if (loading || !data) return null;

  const scoredRows = data.rows.filter(r => r.myScore !== null).slice(0, 6);
  if (scoredRows.length === 0) return null;

  return (
    <div className="card p-5" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Sector Context
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            How you compare to {data.totalPeers} peers in your sector
          </p>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
        >
          Anonymous
        </span>
      </div>

      <div className="space-y-3">
        {scoredRows.map(row => {
          const diff = row.myScore! - row.sectorAvg;
          const myPct = ((row.myScore! - 1) / 2) * 100;
          const avgPct = ((row.sectorAvg - 1) / 2) * 100;
          const sdg = SDG_LIST.find(s => s.id === row.sdgId);
          const myColor = row.myScore! >= 2.4 ? '#00A651' : row.myScore! >= 1.6 ? '#E8A020' : '#D0021B';

          return (
            <div key={row.sdgId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{sdg?.icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    SDG {row.sdgId}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: myColor }}>
                    You: {row.myScore!.toFixed(1)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Avg: {row.sectorAvg.toFixed(1)}
                  </span>
                  <span className="font-semibold" style={{ color: diff >= 0 ? '#00A651' : '#D0021B' }}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="relative h-3">
                <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'rgba(1,83,118,0.25)' }} />
                </div>
                <div className="absolute top-0.5 left-0 right-0 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${myPct}%`, background: myColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full" style={{ background: 'var(--sanlam-teal)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full" style={{ background: 'rgba(1,83,118,0.25)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sector average</span>
        </div>
      </div>
    </div>
  );
}
