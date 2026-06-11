'use client';

import { useState } from 'react';
import { BenchmarkSDGRow } from '@/hooks/useBenchmarkData';
import { toDisplay } from '@/lib/score';

interface Props {
  rows:  BenchmarkSDGRow[];
  size?: number;
}

export default function SDGRadarChart({ rows, size = 420 }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size * 0.38;

  const scoredRows = rows.filter(r => r.myScore !== null);
  const n          = scoredRows.length;

  if (n < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-[#4A5568] text-sm">
        Not enough SDG data to render radar chart.
      </div>
    );
  }

  const scoreFraction = (score: number) => (score - 1) / 2;

  const point = (i: number, fraction: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r     = fraction * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const polyPath = (fractions: number[]) => {
    const pts = fractions.map((f, i) => {
      const p = point(i, f);
      return `${p.x},${p.y}`;
    });
    return `M ${pts.join(' L ')} Z`;
  };

  const myPath   = polyPath(scoredRows.map(r => scoreFraction(r.myScore!)));
  const avgPath  = polyPath(scoredRows.map(r => scoreFraction(r.sectorAvg)));
  const topQPath = polyPath(scoredRows.map(r => scoreFraction(r.topQuartile)));

  const hoveredRow = hoveredIdx !== null ? scoredRows[hoveredIdx] : null;
  const hoveredDot = hoveredIdx !== null ? point(hoveredIdx, scoreFraction(scoredRows[hoveredIdx].myScore!)) : null;

  // Position tooltip so it stays within the SVG bounds
  const tooltipW = 148;
  const tooltipH = 76;
  const tip = hoveredDot ? {
    x: hoveredDot.x > cx ? hoveredDot.x - tooltipW - 10 : hoveredDot.x + 12,
    y: Math.min(Math.max(hoveredDot.y - tooltipH / 2, 6), size - tooltipH - 6),
  } : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
      style={{ overflow: 'visible' }}
    >
      {/* Grid circles */}
      {[1, 2, 3].map(level => (
        <circle key={level} cx={cx} cy={cy}
          r={(level / 3) * radius}
          fill="none" stroke="#DDE3EC" strokeWidth={1}
        />
      ))}

      {/* Level labels — display scale 0–100 */}
      {[1, 2, 3].map(level => (
        <text key={level}
          x={cx + 4} y={cy - (level / 3) * radius + 4}
          fontSize={9} fill="#4A5568" opacity={0.7}
        >
          {Math.round((level / 3) * 100)}
        </text>
      ))}

      {/* Axis lines */}
      {scoredRows.map((_, i) => {
        const outer = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
          stroke="#DDE3EC" strokeWidth={1} />;
      })}

      {/* Top quartile */}
      <path d={topQPath}
        fill="rgba(0,181,237,0.05)" stroke="rgba(0,181,237,0.2)"
        strokeWidth={1} strokeDasharray="3 3"
      />

      {/* Sector average */}
      <path d={avgPath}
        fill="rgba(0,83,118,0.08)" stroke="#015376"
        strokeWidth={1.5} strokeOpacity={0.5}
      />

      {/* My score */}
      <path d={myPath}
        fill="rgba(0,181,237,0.15)" stroke="#00B5ED" strokeWidth={2}
      />

      {/* My score dots + hit areas */}
      {scoredRows.map((r, i) => {
        const p       = point(i, scoreFraction(r.myScore!));
        const active  = hoveredIdx === i;
        const dimmed  = hoveredIdx !== null && !active;
        return (
          <g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Glow ring shown on hover */}
            {active && (
              <circle cx={p.x} cy={p.y} r={10}
                fill="rgba(0,181,237,0.18)"
                stroke="rgba(0,181,237,0.45)"
                strokeWidth={1}
              />
            )}
            {/* Dot */}
            <circle cx={p.x} cy={p.y}
              r={active ? 6 : 4}
              fill={active ? '#00B5ED' : '#00B5ED'}
              stroke="white" strokeWidth={1.5}
              opacity={dimmed ? 0.3 : 1}
              style={{ transition: 'r 150ms, opacity 150ms' }}
            />
            {/* Invisible hit area */}
            <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
          </g>
        );
      })}

      {/* Axis labels */}
      {scoredRows.map((r, i) => {
        const labelRadius = radius + 22;
        const angle       = (i / n) * 2 * Math.PI - Math.PI / 2;
        const lx          = cx + labelRadius * Math.cos(angle);
        const ly          = cy + labelRadius * Math.sin(angle);
        const anchor      = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
        const shortName   = r.sdgShortName.length > 10
          ? r.sdgShortName.slice(0, 10) + '…'
          : r.sdgShortName;
        const active      = hoveredIdx === i;
        return (
          <g key={i} opacity={hoveredIdx !== null && !active ? 0.35 : 1}
            style={{ transition: 'opacity 150ms' }}>
            <text x={lx} y={ly - 2} fontSize={active ? 10 : 9} textAnchor={anchor}
              fill={r.sdgColor} fontWeight={600}>
              SDG {r.sdgId}
            </text>
            <text x={lx} y={ly + 9} fontSize={8} textAnchor={anchor} fill="#4A5568">
              {shortName}
            </text>
          </g>
        );
      })}

      {/* Hover tooltip */}
      {hoveredRow && tip && (() => {
        const myScore  = toDisplay(hoveredRow.myScore!);
        const avgScore = toDisplay(hoveredRow.sectorAvg);
        const diff     = myScore - avgScore;
        const diffColor = diff > 0 ? '#00A651' : diff < 0 ? '#D0021B' : '#4A5568';

        return (
          <g>
            {/* Shadow layer */}
            <rect x={tip.x + 1} y={tip.y + 1} width={tooltipW} height={tooltipH}
              rx={8} fill="rgba(0,0,0,0.12)"
            />
            {/* Card background */}
            <rect x={tip.x} y={tip.y} width={tooltipW} height={tooltipH}
              rx={8} fill="white" stroke="#DDE3EC" strokeWidth={1}
            />
            {/* SDG header bar */}
            <rect x={tip.x} y={tip.y} width={tooltipW} height={20}
              rx={8} fill={hoveredRow.sdgColor + '22'}
            />
            <rect x={tip.x} y={tip.y + 12} width={tooltipW} height={8}
              fill={hoveredRow.sdgColor + '22'}
            />
            <text x={tip.x + 10} y={tip.y + 14}
              fontSize={10} fontWeight={700} fill={hoveredRow.sdgColor}>
              {hoveredRow.sdgIcon} SDG {hoveredRow.sdgId} · {hoveredRow.sdgShortName}
            </text>

            {/* Row: You */}
            <text x={tip.x + 10} y={tip.y + 34} fontSize={9} fill="#4A5568">You</text>
            <text x={tip.x + tooltipW - 10} y={tip.y + 34}
              fontSize={10} fontWeight={700} fill="#00B5ED" textAnchor="end">
              {myScore}
            </text>

            {/* Row: Sector avg */}
            <text x={tip.x + 10} y={tip.y + 50} fontSize={9} fill="#4A5568">Sector avg</text>
            <text x={tip.x + tooltipW - 10} y={tip.y + 50}
              fontSize={10} fontWeight={700} fill="#015376" textAnchor="end">
              {avgScore}
            </text>

            {/* Divider */}
            <line x1={tip.x + 8} y1={tip.y + 56} x2={tip.x + tooltipW - 8} y2={tip.y + 56}
              stroke="#DDE3EC" strokeWidth={0.5}
            />

            {/* Row: Difference */}
            <text x={tip.x + 10} y={tip.y + 69} fontSize={9} fill="#4A5568">Difference</text>
            <text x={tip.x + tooltipW - 10} y={tip.y + 69}
              fontSize={10} fontWeight={700} fill={diffColor} textAnchor="end">
              {diff >= 0 ? '+' : ''}{diff}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
