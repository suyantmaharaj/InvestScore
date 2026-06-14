'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePMData } from '@/hooks/usePMData';
import { SDG_LIST } from '@/lib/sdg';
import SDGIcon from '@/components/sdg/SDGIcon';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import Tooltip from '@/components/shared/Tooltip';
import PageContext from '@/components/shared/PageContext';
import { toDisplay } from '@/lib/score';

type ViewMode = 'grid' | 'score';

function scoreBg(score: number | null): string {
  if (score === null) return 'var(--bg)';
  if (score >= 2.4)   return 'rgba(0,166,81,0.12)';
  if (score >= 1.6)   return 'rgba(232,160,32,0.10)';
  return 'rgba(208,2,27,0.10)';
}

function scoreColor(score: number | null): string {
  if (score === null) return 'var(--border)';
  if (score >= 2.4)   return '#00A651';
  if (score >= 1.6)   return '#E8A020';
  return '#D0021B';
}

function formatSector(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function HeatMapPage() {
  const router = useRouter();
  const { portfolio, loading, error } = usePMData();

  const [viewMode,       setViewMode]       = useState<ViewMode>('grid');
  const [hoveredCell,    setHoveredCell]    = useState<{ companyId: string; sdgId: number } | null>(null);
  const [selectedSDG,    setSelectedSDG]    = useState<number | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const sectors = useMemo(() => {
    const s = new Set(portfolio.map(e => e.company.sector));
    return ['All', ...Array.from(s)];
  }, [portfolio]);

  const filtered = useMemo(() => {
    if (selectedSector === 'All') return portfolio;
    return portfolio.filter(e => e.company.sector === selectedSector);
  }, [portfolio, selectedSector]);

  const activeSDGs = useMemo(() => {
    const sdgIds = new Set<number>();
    filtered.forEach(({ scorecard }) => {
      scorecard?.sdgScores.forEach(s => sdgIds.add(s.sdgId));
    });
    if (selectedSDG) return SDG_LIST.filter(s => s.id === selectedSDG);
    return SDG_LIST.filter(s => sdgIds.has(s.id));
  }, [filtered, selectedSDG]);

  if (loading) {
    return (
      <div className="max-w-full space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
        </div>
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (error || portfolio.length === 0) {
    return (
      <EmptyState
        icon="🗺️"
        title="No portfolio data"
        description="No companies with scored data are available."
      />
    );
  }

  return (
    <div className="max-w-full space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing: <strong style={{ color: 'var(--text-primary)' }}>
            {filtered.length} companies × {activeSDGs.length} SDGs
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {[
            { label: 'High ≥65',      color: '#00A651', bg: 'rgba(0,166,81,0.12)'    },
            { label: 'Medium 25–64',  color: '#E8A020', bg: 'rgba(232,160,32,0.10)' },
            { label: 'Low <25',       color: '#D0021B', bg: 'rgba(208,2,27,0.10)'   },
            { label: 'N/A',           color: 'var(--text-muted)', bg: 'var(--bg)'   },
          ].map(({ label, color, bg }) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ background: bg, border: `1px solid ${color}`, opacity: 0.9 }}
              />
              {label}
            </span>
          ))}
        </div>
      </PageContext>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedSector}
          onChange={e => setSelectedSector(e.target.value)}
          className="h-9 px-3 text-xs rounded-xl focus:outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {sectors.map(s => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Sectors' : formatSector(s)}
            </option>
          ))}
        </select>

        <select
          value={selectedSDG ?? ''}
          onChange={e => setSelectedSDG(e.target.value ? parseInt(e.target.value) : null)}
          className="h-9 px-3 text-xs rounded-xl focus:outline-none"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="">All SDGs</option>
          {SDG_LIST.map(s => (
            <option key={s.id} value={s.id}>SDG {s.id} – {s.shortName}</option>
          ))}
        </select>

        {/* View toggle */}
        <div
          className="flex gap-0.5 p-1 rounded-xl ml-auto"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          {([{ key: 'grid', label: 'Colour' }, { key: 'score', label: 'Score' }] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg pressable"
              style={{
                background: viewMode === key ? 'var(--sanlam-navy)' : 'transparent',
                color:      viewMode === key ? 'white'              : 'var(--text-muted)',
                transition: 'background 150ms var(--ease-out), color 150ms var(--ease-out)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Heat map */}
      <div
        className="card overflow-auto"
        style={{ background: 'var(--surface)', maxHeight: 'calc(100vh - 320px)' }}
      >
        <table className="w-full border-collapse" style={{ minWidth: `${activeSDGs.length * 52 + 200}px` }}>
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 text-left px-4 py-3 text-xs font-semibold"
                style={{
                  background:   'var(--surface)',
                  color:        'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  borderRight:  '1px solid var(--border)',
                  minWidth:     '180px',
                }}
              >
                Company
              </th>

              {activeSDGs.map(sdg => (
                <th
                  key={sdg.id}
                  className="px-1 py-3 text-center"
                  style={{ borderBottom: '1px solid var(--border)', minWidth: '48px', cursor: 'pointer' }}
                  onClick={() => setSelectedSDG(selectedSDG === sdg.id ? null : sdg.id)}
                >
                  <Tooltip content={sdg.name} position="top">
                    <div className="flex flex-col items-center gap-0.5">
                      <SDGIcon sdgId={sdg.id} size={20} />
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: selectedSDG === sdg.id ? sdg.color : 'var(--text-muted)' }}
                      >
                        {sdg.id}
                      </span>
                      {selectedSDG === sdg.id && (
                        <div className="w-4 h-0.5 rounded-full" style={{ background: sdg.color }} />
                      )}
                    </div>
                  </Tooltip>
                </th>
              ))}

              <th
                className="px-3 py-3 text-center text-xs font-semibold sticky right-0"
                style={{
                  background:   'var(--surface)',
                  color:        'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  borderLeft:   '1px solid var(--border)',
                  minWidth:     '72px',
                }}
              >
                Overall
              </th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(({ company, scorecard }) => {
              const scoreMap = new Map(scorecard?.sdgScores.map(s => [s.sdgId, s]) ?? []);

              return (
                <tr
                  key={company.id}
                  className="cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms var(--ease-out)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => router.push(`/company/${company.id}`)}
                >
                  <td
                    className="sticky left-0 px-4 py-2.5"
                    style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: 'var(--sanlam-navy)' }}
                      >
                        {company.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-semibold truncate max-w-[130px]" style={{ color: 'var(--text-primary)' }}>
                          {company.name}
                        </p>
                        <p className="text-[10px] truncate max-w-[130px]" style={{ color: 'var(--text-muted)' }}>
                          {formatSector(company.sector)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {activeSDGs.map(sdg => {
                    const s     = scoreMap.get(sdg.id) ?? null;
                    const score = s?.score ?? null;
                    const isHovered = hoveredCell?.companyId === company.id && hoveredCell?.sdgId === sdg.id;

                    return (
                      <td
                        key={sdg.id}
                        className="px-1 py-2 text-center"
                        onMouseEnter={() => setHoveredCell({ companyId: company.id, sdgId: sdg.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <Tooltip
                          content={
                            score
                              ? `${company.name} · SDG ${sdg.id}: ${toDisplay(score)} (${s?.classification})`
                              : `${company.name} · SDG ${sdg.id}: N/A`
                          }
                          position="top"
                        >
                          <div
                            className="w-9 h-7 mx-auto rounded-md flex items-center justify-center"
                            style={{
                              background: scoreBg(score),
                              border:     `1px solid ${score ? scoreColor(score) + '40' : 'var(--border)'}`,
                              transform:  isHovered ? 'scale(1.2)' : 'scale(1)',
                              transition: 'transform 150ms var(--ease-out)',
                            }}
                          >
                            {viewMode === 'score' && score ? (
                              <span className="text-[10px] font-bold" style={{ color: scoreColor(score) }}>
                                {toDisplay(score)}
                              </span>
                            ) : score ? (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: scoreColor(score) }} />
                            ) : (
                              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>–</span>
                            )}
                          </div>
                        </Tooltip>
                      </td>
                    );
                  })}

                  <td
                    className="px-3 py-2 text-center sticky right-0"
                    style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
                  >
                    {scorecard ? (
                      <span className="font-bold text-sm" style={{ color: scoreColor(scorecard.overallScore) }}>
                        {toDisplay(scorecard.overallScore)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Click any row to view the full company scorecard and investment narrative
      </p>

    </div>
  );
}
