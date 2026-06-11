'use client';

import { useScoreHistory } from '@/hooks/usePMData';

interface SparkPoint { period: string; score: number; }

function SparklineSVG({ points }: { points: SparkPoint[] }) {
  if (points.length < 2) {
    return <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>-</span>;
  }

  const W = 56;
  const H = 20;
  const scores = points.map(p => p.score);
  const min    = Math.min(...scores);
  const max    = Math.max(...scores);
  const range  = max - min || 0.5;

  const toXY = (i: number, score: number) => ({
    x: (i / (points.length - 1)) * W,
    y: H - ((score - min) / range) * H * 0.78 - H * 0.11,
  });

  const coords = points.map((p, i) => {
    const { x, y } = toXY(i, p.score);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last   = points[points.length - 1].score;
  const first  = points[0].score;
  const delta  = last - first;
  const color  = delta >= 0.05 ? '#00A651' : delta <= -0.05 ? '#D0021B' : '#E8A020';
  const lastPt = toXY(points.length - 1, last);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
    >
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}

export default function ScoreSparkline({ companyId }: { companyId: string }) {
  const { history } = useScoreHistory(companyId);
  return <SparklineSVG points={history.slice(-4)} />;
}
