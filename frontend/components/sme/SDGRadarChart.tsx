'use client';

import { BenchmarkSDGRow } from '@/hooks/useBenchmarkData';

interface Props {
  rows:  BenchmarkSDGRow[];
  size?: number;
}

export default function SDGRadarChart({ rows, size = 420 }: Props) {
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

  // Convert score (1–3) to radius fraction (0–1)
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

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* Grid circles at 1.0, 2.0, 3.0 */}
      {[1, 2, 3].map(level => (
        <circle
          key={level}
          cx={cx} cy={cy}
          r={(level / 3) * radius}
          fill="none" stroke="#DDE3EC" strokeWidth={1}
        />
      ))}

      {/* Level labels */}
      {[1, 2, 3].map(level => (
        <text
          key={level}
          x={cx + 4}
          y={cy - (level / 3) * radius + 4}
          fontSize={9} fill="#4A5568" opacity={0.7}
        >
          {level}.0
        </text>
      ))}

      {/* Axis lines */}
      {scoredRows.map((_, i) => {
        const outer = point(i, 1);
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
            stroke="#DDE3EC" strokeWidth={1} />
        );
      })}

      {/* Top quartile — dashed faint */}
      <path d={topQPath}
        fill="rgba(0,181,237,0.05)"
        stroke="rgba(0,181,237,0.2)"
        strokeWidth={1} strokeDasharray="3 3"
      />

      {/* Sector average */}
      <path d={avgPath}
        fill="rgba(0,83,118,0.08)"
        stroke="#015376" strokeWidth={1.5} strokeOpacity={0.5}
      />

      {/* My score */}
      <path d={myPath}
        fill="rgba(0,181,237,0.15)"
        stroke="#00B5ED" strokeWidth={2}
      />

      {/* My score dots */}
      {scoredRows.map((r, i) => {
        const p = point(i, scoreFraction(r.myScore!));
        return (
          <circle key={i} cx={p.x} cy={p.y} r={4}
            fill="#00B5ED" stroke="white" strokeWidth={1.5}
          />
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

        return (
          <g key={i}>
            <text x={lx} y={ly - 2} fontSize={9} textAnchor={anchor}
              fill={r.sdgColor} fontWeight={600}>
              SDG {r.sdgId}
            </text>
            <text x={lx} y={ly + 9} fontSize={8} textAnchor={anchor} fill="#4A5568">
              {shortName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
