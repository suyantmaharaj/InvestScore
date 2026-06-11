'use client';

import { useState, useMemo } from 'react';
import { usePMData } from '@/hooks/usePMData';
import { SDG_LIST } from '@/lib/sdg';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import { X, Plus, Download, Trophy } from 'lucide-react';

const COMPANY_COLORS = ['#00B5ED', '#00A651', '#E8A020', '#6366F1'];

interface CompanyComparison {
  id:             string;
  name:           string;
  sector:         string;
  mandate:        string;
  color:          string;
  overallScore:   number;
  classification: string;
  sdgScores:      Record<number, { score: number; classification: string }>;
  wins:           number;
  avgScore:       number;
  strongestSDG:   number;
  weakestSDG:     number;
}

export default function ComparePage() {
  const { portfolio, loading } = usePMData();

  const [selectedIds,   setSelectedIds]   = useState<string[]>([]);
  const [showSelector,  setShowSelector]  = useState(false);
  const [sdgFilter,     setSdgFilter]     = useState<'all' | 'low' | 'high'>('all');

  // Build comparison data for selected companies
  const compared = useMemo<CompanyComparison[]>(() => {
    return selectedIds.map((id, idx) => {
      const entry = portfolio.find(({ company }) => company.id === id);
      if (!entry?.scorecard) return null;

      const { company, scorecard } = entry;
      const sdgMap: Record<number, { score: number; classification: string }> = {};
      scorecard.sdgScores.forEach((s: any) => {
        sdgMap[s.sdgId] = { score: s.score, classification: s.classification };
      });

      const scores   = Object.values(sdgMap).map(s => s.score);
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const sorted = Object.entries(sdgMap).sort(([, a], [, b]) => b.score - a.score);

      return {
        id,
        name:           company.name,
        sector:         company.sector,
        mandate:        company.mandate || 'Growth',
        color:          COMPANY_COLORS[idx] || '#4A5568',
        overallScore:   scorecard.overallScore,
        classification: scorecard.classification,
        sdgScores:      sdgMap,
        wins:           0,
        avgScore:       Math.round(avgScore * 100) / 100,
        strongestSDG:   parseInt(sorted[0]?.[0] || '0'),
        weakestSDG:     parseInt(sorted[sorted.length - 1]?.[0] || '0'),
      };
    }).filter(Boolean) as CompanyComparison[];
  }, [selectedIds, portfolio]);

  // Best-in-class per SDG across the full portfolio
  const portfolioBest = useMemo<Record<number, number>>(() => {
    const best: Record<number, number> = {};
    portfolio.forEach(({ scorecard }) => {
      if (!scorecard) return;
      scorecard.sdgScores.forEach((s: any) => {
        if (!best[s.sdgId] || s.score > best[s.sdgId]) {
          best[s.sdgId] = s.score;
        }
      });
    });
    return best;
  }, [portfolio]);

  // Wins per company - how many SDGs each company tops among selected
  const comparedWithWins = useMemo(() => {
    return compared.map(c => {
      const wins = SDG_LIST.filter(sdg => {
        const myScore  = c.sdgScores[sdg.id]?.score || 0;
        const maxScore = Math.max(...compared.map(o => o.sdgScores[sdg.id]?.score || 0));
        return myScore === maxScore && myScore > 0;
      }).length;
      return { ...c, wins };
    });
  }, [compared]);

  const visibleSDGs = useMemo(() => {
    if (sdgFilter === 'all') return SDG_LIST;
    return SDG_LIST.filter(sdg => {
      const scores = compared.map(c => c.sdgScores[sdg.id]?.score || 0);
      const avg    = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      if (sdgFilter === 'low')  return avg < 1.6;
      if (sdgFilter === 'high') return avg >= 2.4;
      return true;
    });
  }, [sdgFilter, compared]);

  const availableToAdd = portfolio
    .filter(({ company, scorecard }) => scorecard && !selectedIds.includes(company.id))
    .map(({ company, scorecard }) => ({
      id:    company.id,
      name:  company.name,
      score: scorecard!.overallScore,
    }));

  const handleAdd = (id: string) => {
    if (selectedIds.length >= 4) return;
    setSelectedIds(prev => [...prev, id]);
    setShowSelector(false);
  };

  const handleRemove = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const exportComparison = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W    = 297;
    const H    = 210;
    const navy:  [number, number, number] = [1, 83, 118];
    const white: [number, number, number] = [255, 255, 255];
    const gray:  [number, number, number] = [74, 85, 104];

    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 20, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INvestScore - Company Comparison', 14, 13);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${comparedWithWins.map(c => c.name).join(' vs ')}  ·  ${new Date().toLocaleDateString('en-ZA')}`,
      W - 14, 13, { align: 'right' }
    );

    let y = 30;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('SDG Goal', 14, y);
    comparedWithWins.forEach((c, i) => doc.text(c.name.substring(0, 18), 80 + i * 52, y));
    doc.text('Best', W - 30, y);
    y += 5;

    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, W - 14, y);
    y += 4;

    SDG_LIST.forEach((sdg, si) => {
      if (y > H - 15) { doc.addPage(); y = 20; }

      const rowBg: [number, number, number] = si % 2 === 0 ? [255, 255, 255] : [244, 246, 248];
      doc.setFillColor(...rowBg);
      doc.rect(14, y - 3, W - 28, 7, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(`SDG ${sdg.id} ${sdg.shortName}`.substring(0, 24), 14, y + 2);

      comparedWithWins.forEach((c, i) => {
        const s = c.sdgScores[sdg.id];
        if (s) {
          const sc: [number, number, number] =
            s.score >= 2.4 ? [0, 166, 81] : s.score >= 1.6 ? [232, 160, 32] : [208, 2, 27];
          doc.setTextColor(...sc);
          doc.setFont('helvetica', 'bold');
          doc.text(s.score.toFixed(1), 80 + i * 52, y + 2);
        }
      });

      const best = portfolioBest[sdg.id];
      if (best) {
        doc.setTextColor(0, 181, 237);
        doc.setFont('helvetica', 'bold');
        doc.text(best.toFixed(1), W - 30, y + 2);
      }
      y += 7;
    });

    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('Overall', 14, y);
    comparedWithWins.forEach((c, i) => {
      const sc: [number, number, number] =
        c.overallScore >= 2.4 ? [0, 166, 81] : c.overallScore >= 1.6 ? [232, 160, 32] : [208, 2, 27];
      doc.setTextColor(...sc);
      doc.text(c.overallScore.toFixed(1), 80 + i * 52, y);
    });

    const pageCount = (doc as any).getNumberOfPages?.() ?? (doc.internal as any).pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...navy);
      doc.rect(0, H - 10, W, 10, 'F');
      doc.setTextColor(...white);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('INvestScore  |  Sanlam Investments  |  104+ SMME Growth & Empowerment Solution', 14, H - 4);
      doc.text(`Page ${i} of ${pageCount}  |  CONFIDENTIAL`, W - 50, H - 4);
    }

    doc.save(`INvestScore_Comparison_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  const BAR_H = 18;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {selectedIds.length} of 4 companies selected
        </span>
        {selectedIds.length >= 2 && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <button
              onClick={exportComparison}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg pressable"
              style={{
                background: 'var(--bg)',
                border:     '1px solid var(--border)',
                color:      'var(--text-muted)',
              }}
            >
              <Download size={12} /> Export PDF
            </button>
          </>
        )}
      </PageContext>

      {/* Company selector */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Select companies to compare
        </p>
        <div className="flex flex-wrap gap-2">

          {/* Selected chips */}
          {comparedWithWins.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: `${c.color}12`, border: `1.5px solid ${c.color}40` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-xs font-semibold" style={{ color: c.color }}>
                {c.name}
              </span>
              <span className="text-xs" style={{ color: c.color }}>
                {c.overallScore.toFixed(1)}
              </span>
              <button onClick={() => handleRemove(c.id)} style={{ color: c.color }}>
                <X size={13} />
              </button>
            </div>
          ))}

          {/* Add button + dropdown */}
          {selectedIds.length < 4 && (
            <div className="relative">
              <button
                onClick={() => setShowSelector(s => !s)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium pressable"
                style={{
                  background: 'var(--bg)',
                  border:     '1.5px dashed var(--border)',
                  color:      'var(--text-muted)',
                  transition: 'border-color 150ms var(--ease-out), color 150ms var(--ease-out)',
                }}
              >
                <Plus size={13} /> Add company
              </button>
              {showSelector && (
                <div
                  className="absolute top-10 left-0 z-20 rounded-xl shadow-lg overflow-hidden animate-card-in"
                  style={{
                    background: 'var(--surface)',
                    border:     '1px solid var(--border)',
                    width:      '240px',
                    maxHeight:  '280px',
                    overflowY:  'auto',
                  }}
                >
                  {availableToAdd.length === 0 ? (
                    <p className="text-xs p-3" style={{ color: 'var(--text-muted)' }}>
                      All companies added
                    </p>
                  ) : (
                    availableToAdd.map(({ id, name, score }) => (
                      <button
                        key={id}
                        onClick={() => handleAdd(id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left pressable"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {name}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: score >= 2.4 ? '#00A651' : score >= 1.6 ? '#E8A020' : '#D0021B' }}
                        >
                          {score.toFixed(1)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedIds.length === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Select 2–4 companies to begin comparison
          </p>
        )}
      </div>

      {comparedWithWins.length >= 2 && (
        <>
          {/* Summary cards - one per company */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${comparedWithWins.length}, 1fr)` }}
          >
            {comparedWithWins.map((c, idx) => {
              const isTopOverall = c.overallScore === Math.max(...comparedWithWins.map(x => x.overallScore));
              const strongSDG    = SDG_LIST.find(s => s.id === c.strongestSDG);
              const weakSDG      = SDG_LIST.find(s => s.id === c.weakestSDG);

              return (
                <div
                  key={c.id}
                  className="card p-4 animate-card-in"
                  style={{
                    background:     'var(--surface)',
                    borderTop:      `3px solid ${c.color}`,
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  {isTopOverall && (
                    <div className="flex items-center gap-1 mb-2">
                      <Trophy size={12} style={{ color: '#E8A020' }} />
                      <span className="text-[10px] font-bold" style={{ color: '#E8A020' }}>
                        Top overall
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-semibold mb-1 truncate" style={{ color: c.color }}>
                    {c.name}
                  </p>
                  <p className="font-bold text-2xl mb-0.5" style={{ color: c.color }}>
                    {c.overallScore.toFixed(1)}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    {c.classification} Impact
                  </p>
                  <div className="space-y-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <p>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {c.wins}
                      </span>{' '}
                      SDG {c.wins === 1 ? 'win' : 'wins'}
                    </p>
                    {strongSDG && <p>Strongest: {strongSDG.icon} SDG {strongSDG.id}</p>}
                    {weakSDG   && <p>Weakest: {weakSDG.icon} SDG {weakSDG.id}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SDG filter */}
          <div className="flex gap-2">
            {[
              { key: 'all',  label: 'All SDGs'    },
              { key: 'low',  label: 'Low scoring'  },
              { key: 'high', label: 'High scoring' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSdgFilter(key as typeof sdgFilter)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium pressable"
                style={{
                  background: sdgFilter === key ? 'rgba(0,181,237,0.1)' : 'var(--surface)',
                  color:      sdgFilter === key ? 'var(--sanlam-teal)'  : 'var(--text-muted)',
                  border:     `1px solid ${sdgFilter === key ? 'rgba(0,181,237,0.2)' : 'var(--border)'}`,
                  transition: 'all 150ms var(--ease-out)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* SDG comparison bars */}
          <div className="card p-5" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                SDG Performance Comparison
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {comparedWithWins.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {c.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-0"
                    style={{ borderTop: '2px dashed rgba(0,181,237,0.6)', width: '12px' }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Best in portfolio
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {visibleSDGs.map(sdg => (
                <div key={sdg.id} className="flex items-start gap-3">
                  {/* SDG label */}
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0"
                    style={{ width: '100px', paddingTop: '3px' }}
                  >
                    <span className="text-sm leading-none">{sdg.icon}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      SDG {sdg.id}
                    </span>
                  </div>

                  {/* Bars */}
                  <div className="flex-1">
                    {comparedWithWins.map(c => {
                      const s       = c.sdgScores[sdg.id];
                      const score   = s?.score || 0;
                      const pct     = score > 0 ? ((score - 1) / 2) * 100 : 0;
                      const isWin   = score === Math.max(...comparedWithWins.map(x => x.sdgScores[sdg.id]?.score || 0)) && score > 0;
                      const best    = portfolioBest[sdg.id] || 0;
                      const bestPct = best > 0 ? ((best - 1) / 2) * 100 : 0;

                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 mb-1"
                          style={{ height: `${BAR_H}px` }}
                        >
                          <div
                            className="relative flex-1 rounded-full overflow-visible"
                            style={{ height: '10px', background: 'var(--border)' }}
                          >
                            {/* Company bar */}
                            <div
                              className="absolute top-0 left-0 h-full rounded-full"
                              style={{
                                width:      `${pct}%`,
                                background: c.color,
                                opacity:    score > 0 ? 0.85 : 0.2,
                                transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)',
                              }}
                            />
                            {/* Best-in-portfolio dashed marker */}
                            <div
                              className="absolute top-0 h-full"
                              style={{
                                left:       `${bestPct}%`,
                                width:      '2px',
                                background: 'rgba(0,181,237,0.55)',
                              }}
                            />
                          </div>
                          <span
                            className="text-[11px] font-semibold flex-shrink-0"
                            style={{ width: '28px', color: score > 0 ? c.color : 'var(--text-muted)' }}
                          >
                            {score > 0 ? score.toFixed(1) : '-'}
                          </span>
                          {isWin && score > 0 && (
                            <Trophy size={10} style={{ color: '#E8A020', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Win summary table */}
          <div className="card" style={{ background: 'var(--surface)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                SDG Wins Summary
              </p>
            </div>
            <div
              className="grid px-5 py-4 gap-4"
              style={{ gridTemplateColumns: `repeat(${comparedWithWins.length}, 1fr)` }}
            >
              {comparedWithWins.map(c => (
                <div key={c.id} className="text-center">
                  <p className="text-[11px] font-semibold mb-1 truncate" style={{ color: c.color }}>
                    {c.name}
                  </p>
                  <p className="font-bold text-3xl" style={{ color: c.color }}>
                    {c.wins}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    SDG {c.wins === 1 ? 'win' : 'wins'}
                  </p>
                  <p className="text-xs mt-1 font-semibold" style={{ color: c.color }}>
                    Avg: {c.avgScore.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {comparedWithWins.length < 2 && selectedIds.length < 2 && (
        <div className="card p-10 text-center" style={{ background: 'var(--surface)' }}>
          <p className="text-2xl mb-3">⚖️</p>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Select 2–4 companies to compare
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Use the selector above to pick companies and see their SDG performance side-by-side
          </p>
        </div>
      )}

    </div>
  );
}
