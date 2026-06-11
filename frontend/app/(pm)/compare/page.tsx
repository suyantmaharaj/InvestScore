'use client';

import { useState, useMemo } from 'react';
import { usePMData } from '@/hooks/usePMData';
import { SDG_LIST } from '@/lib/sdg';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import AnimatedScore from '@/components/shared/AnimatedScore';
import Tooltip from '@/components/shared/Tooltip';
import PageContext from '@/components/shared/PageContext';
import { toDisplay } from '@/lib/score';

function scoreColor(s: number) {
  if (s >= 2.4) return '#00A651';
  if (s >= 1.6) return '#E8A020';
  return '#D0021B';
}

function formatSector(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function CompanyAvatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <div
      className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: 'var(--sanlam-navy)', width: size * 4, height: size * 4, fontSize: size * 1.4 }}
    >
      {initials}
    </div>
  );
}

/* Single SDG comparison row — mirrored bars */
function SDGRow({
  sdgId,
  aScore,
  bScore,
  idx,
}: {
  sdgId:  number;
  aScore: number | null;
  bScore: number | null;
  idx:    number;
}) {
  const sdg  = SDG_LIST.find(d => d.id === sdgId);
  const aPct = aScore != null ? ((aScore - 1) / 2) * 100 : 0;
  const bPct = bScore != null ? ((bScore - 1) / 2) * 100 : 0;

  return (
    <div
      className="animate-card-in"
      style={{ animationDelay: `${idx * 30}ms`, borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}
    >
      {/* SDG label row */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base leading-none">{sdg?.icon ?? '🎯'}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          SDG {sdgId}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sdg?.shortName ?? ''}
        </span>
      </div>

      {/* Mirrored bars */}
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr 48px 1fr' }}>

        {/* Left bar (company A) — grows from centre outward */}
        <div className="flex items-center gap-2 justify-end">
          {aScore != null ? (
            <>
              <span className="text-xs font-bold w-8 text-right" style={{ color: scoreColor(aScore) }}>
                {toDisplay(aScore)}
              </span>
              <div className="flex-1 flex justify-end" style={{ height: 8 }}>
                <div
                  className="rounded-l-full"
                  style={{
                    width: `${aPct}%`,
                    height: '100%',
                    background: scoreColor(aScore),
                    opacity: 0.85,
                    transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </div>
            </>
          ) : (
            <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>N/A</span>
          )}
        </div>

        {/* Centre SDG icon */}
        <Tooltip content={sdg?.name ?? `SDG ${sdgId}`} position="top">
          <div
            className="w-12 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: `${sdg?.color ?? '#888'}15`, border: `1px solid ${sdg?.color ?? '#888'}30` }}
          >
            <span className="text-sm">{sdg?.icon ?? sdgId}</span>
          </div>
        </Tooltip>

        {/* Right bar (company B) — grows from centre outward */}
        <div className="flex items-center gap-2">
          {bScore != null ? (
            <>
              <div className="flex-1" style={{ height: 8 }}>
                <div
                  className="rounded-r-full"
                  style={{
                    width: `${bPct}%`,
                    height: '100%',
                    background: scoreColor(bScore),
                    opacity: 0.85,
                    transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </div>
              <span className="text-xs font-bold w-8" style={{ color: scoreColor(bScore) }}>
                {toDisplay(bScore)}
              </span>
            </>
          ) : (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { portfolio, loading, error } = usePMData();

  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  const entryA = portfolio.find(e => e.company.id === aId);
  const entryB = portfolio.find(e => e.company.id === bId);

  const allSDGIds = useMemo(() => {
    const ids = new Set<number>();
    entryA?.scorecard?.sdgScores.forEach(s => ids.add(s.sdgId));
    entryB?.scorecard?.sdgScores.forEach(s => ids.add(s.sdgId));
    return SDG_LIST.filter(s => ids.has(s.id)).map(s => s.id);
  }, [entryA, entryB]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (error || portfolio.length === 0) {
    return (
      <EmptyState
        icon="⚖️"
        title="No portfolio data"
        description="No companies available to compare."
      />
    );
  }

  const canCompare = !!(entryA?.scorecard && entryB?.scorecard && aId !== bId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Select two companies to compare side-by-side
        </span>
      </PageContext>

      {/* Company selectors */}
      <div className="grid grid-cols-2 gap-4">
        {([
          { id: aId, setId: setAId, label: 'Company A', side: 'left'  },
          { id: bId, setId: setBId, label: 'Company B', side: 'right' },
        ] as { id: string; setId: (v: string) => void; label: string; side: string }[]).map(({ id, setId, label, side }) => {
          const entry = portfolio.find(e => e.company.id === id);
          return (
            <div key={side} className="card p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <select
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-xl focus:outline-none mb-3"
                style={{
                  background: 'var(--bg)',
                  border:     '1.5px solid var(--border)',
                  color:      'var(--text-primary)',
                }}
              >
                <option value="">Select company</option>
                {portfolio.map(e => (
                  <option key={e.company.id} value={e.company.id}>
                    {e.company.name}
                  </option>
                ))}
              </select>

              {entry ? (
                <div className="flex items-center gap-3">
                  <CompanyAvatar name={entry.company.name} size={9} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {entry.company.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatSector(entry.company.sector)}
                    </p>
                  </div>
                  {entry.scorecard && (
                    <div className="ml-auto text-right">
                      <span className="font-bold text-xl" style={{ color: scoreColor(entry.scorecard.overallScore) }}>
                        {toDisplay(entry.scorecard.overallScore)}
                      </span>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/100</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No company selected</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Same company warning */}
      {aId && bId && aId === bId && (
        <div
          className="card p-4 text-sm text-center"
          style={{ color: '#E8A020', background: 'rgba(232,160,32,0.05)', border: '1px solid rgba(232,160,32,0.2)' }}
        >
          Select two <em>different</em> companies to compare.
        </div>
      )}

      {/* Comparison panel */}
      {canCompare && entryA && entryB && entryA.scorecard && entryB.scorecard && (
        <div className="space-y-5 animate-page-in">

          {/* Overall score banner */}
          <div className="card p-5">
            <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
              {/* Company A */}
              <div className="text-center">
                <CompanyAvatar name={entryA.company.name} size={12} />
                <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                  {entryA.company.name}
                </p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  {formatSector(entryA.company.sector)}
                </p>
                <AnimatedScore
                  value={entryA.scorecard.overallScore}
                  className="font-bold text-4xl block"
                  style={{ color: scoreColor(entryA.scorecard.overallScore) }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</p>
                <div className="mt-2">
                  <AnimatedProgressBar
                    value={((entryA.scorecard.overallScore - 1) / 2) * 100}
                    color={scoreColor(entryA.scorecard.overallScore)}
                    height={5}
                    delay={200}
                  />
                </div>
              </div>

              {/* VS */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                VS
              </div>

              {/* Company B */}
              <div className="text-center">
                <CompanyAvatar name={entryB.company.name} size={12} />
                <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                  {entryB.company.name}
                </p>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  {formatSector(entryB.company.sector)}
                </p>
                <AnimatedScore
                  value={entryB.scorecard.overallScore}
                  className="font-bold text-4xl block"
                  style={{ color: scoreColor(entryB.scorecard.overallScore) }}
                />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</p>
                <div className="mt-2">
                  <AnimatedProgressBar
                    value={((entryB.scorecard.overallScore - 1) / 2) * 100}
                    color={scoreColor(entryB.scorecard.overallScore)}
                    height={5}
                    delay={300}
                  />
                </div>
              </div>
            </div>

            {/* Who wins */}
            {entryA.scorecard.overallScore !== entryB.scorecard.overallScore && (
              <p
                className="text-xs text-center mt-4 font-semibold"
                style={{ color: 'var(--sanlam-teal)' }}
              >
                {entryA.scorecard.overallScore > entryB.scorecard.overallScore
                  ? `${entryA.company.name} leads by ${toDisplay(entryA.scorecard.overallScore) - toDisplay(entryB.scorecard.overallScore)} pts`
                  : `${entryB.company.name} leads by ${toDisplay(entryB.scorecard.overallScore) - toDisplay(entryA.scorecard.overallScore)} pts`
                }
              </p>
            )}
          </div>

          {/* SDG-by-SDG mirrored bars */}
          <div className="card p-5">
            {/* Column headers */}
            <div className="grid items-center gap-3 mb-4" style={{ gridTemplateColumns: '1fr 48px 1fr' }}>
              <p className="text-xs font-semibold text-right" style={{ color: 'var(--text-muted)' }}>
                {entryA.company.name}
              </p>
              <div />
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {entryB.company.name}
              </p>
            </div>

            {allSDGIds.map((sdgId, i) => {
              const aSDG = entryA.scorecard!.sdgScores.find(s => s.sdgId === sdgId);
              const bSDG = entryB.scorecard!.sdgScores.find(s => s.sdgId === sdgId);
              return (
                <SDGRow
                  key={sdgId}
                  sdgId={sdgId}
                  aScore={aSDG?.score ?? null}
                  bScore={bSDG?.score ?? null}
                  idx={i}
                />
              );
            })}
          </div>

          {/* Key differences summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Key Differences
            </h3>
            <div className="space-y-2">
              {allSDGIds
                .map(sdgId => {
                  const a = entryA.scorecard!.sdgScores.find(s => s.sdgId === sdgId)?.score ?? null;
                  const b = entryB.scorecard!.sdgScores.find(s => s.sdgId === sdgId)?.score ?? null;
                  if (a == null || b == null) return null;
                  return { sdgId, diff: Math.abs(a - b), aScore: a, bScore: b };
                })
                .filter(Boolean)
                .sort((x, y) => y!.diff - x!.diff)
                .slice(0, 4)
                .map(item => {
                  if (!item) return null;
                  const sdg    = SDG_LIST.find(d => d.id === item.sdgId);
                  const leader = item.aScore > item.bScore ? entryA.company.name : entryB.company.name;
                  return (
                    <div
                      key={item.sdgId}
                      className="flex items-center gap-3 py-2"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <span className="text-base">{sdg?.icon ?? '🎯'}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          SDG {item.sdgId}: {sdg?.shortName}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {leader} leads by {Math.round((item.diff / 2) * 100)} pts
                        </p>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--sanlam-teal)' }}>
                        Δ {Math.round((item.diff / 2) * 100)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!canCompare && !(aId && bId && aId === bId) && (
        <EmptyState
          icon="⚖️"
          title="Select two companies"
          description="Use the dropdowns above to pick two companies and compare their SDG performance side-by-side."
        />
      )}

    </div>
  );
}
