'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crosshair, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePMData } from '@/hooks/usePMData';
import { useAttentionScores } from '@/hooks/useAttentionScores';
import { QUADRANT_CONFIG, QuadrantKey, AttentionScoreResult } from '@/lib/attention-score';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';

// ─── Scatter helpers ──────────────────────────────────────────────────────────

const PLOT_W  = 520;
const PLOT_H  = 360;
const PAD_L   = 48;
const PAD_R   = 16;
const PAD_T   = 16;
const PAD_B   = 40;
const DATA_W  = PLOT_W - PAD_L - PAD_R;
const DATA_H  = PLOT_H - PAD_T - PAD_B;

// overallScore is on a 1–3 scale; normalize to 0–1 before mapping to pixel space
const SCORE_MIN = 1;
const SCORE_MAX = 3;
function scoreToX(score: number) {
  const norm = (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
  return PAD_L + norm * DATA_W;
}
function attentionToY(attention: number) {
  return PAD_T + ((100 - attention) / 100) * DATA_H;
}

function companyColor(name: string) {
  const palette = [
    '#00B5ED', '#00A651', '#F59E0B', '#6366F1',
    '#EC4899', '#EF4444', '#8B5CF6', '#10B981',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Bar component ────────────────────────────────────────────────────────────

function AttentionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttentionPage() {
  const router                    = useRouter();
  const { portfolio, loading: pmLoading } = usePMData();
  const { scores, loading: attLoading }   = useAttentionScores(portfolio);

  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantKey | 'all'>('all');
  const [tooltip, setTooltip] = useState<{
    score: AttentionScoreResult;
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const loading = pmLoading || attLoading;

  const filtered = quadrantFilter === 'all'
    ? scores
    : scores.filter(s => s.quadrant === quadrantFilter);

  const counts: Record<QuadrantKey, number> = {
    priority:  scores.filter(s => s.quadrant === 'priority').length,
    watch:     scores.filter(s => s.quadrant === 'watch').length,
    coaching:  scores.filter(s => s.quadrant === 'coaching').length,
    on_track:  scores.filter(s => s.quadrant === 'on_track').length,
  };

  useEffect(() => {
    const hide = () => setTooltip(null);
    window.addEventListener('scroll', hide);
    return () => window.removeEventListener('scroll', hide);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const avgAttention = scores.length
    ? Math.round(scores.reduce((s, c) => s + c.attentionScore, 0) / scores.length)
    : 0;
  const improving = scores.filter(s => s.trend === 'improving').length;
  const declining = scores.filter(s => s.trend === 'declining').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{scores.length}</strong> companies tracked
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Avg attention score:{' '}
          <strong style={{ color: avgAttention >= 60 ? '#EF4444' : avgAttention >= 40 ? '#F59E0B' : '#00A651' }}>
            {avgAttention}
          </strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: '#00A651' }}>↑ {improving}</span> improving ·{' '}
          <span style={{ color: '#EF4444' }}>↓ {declining}</span> declining
        </span>
      </PageContext>

      {/* Summary quadrant cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(QUADRANT_CONFIG) as QuadrantKey[]).map(key => {
          const cfg    = QUADRANT_CONFIG[key];
          const active = quadrantFilter === key;
          return (
            <button
              key={key}
              onClick={() => setQuadrantFilter(active ? 'all' : key)}
              className="card p-4 text-left transition-all"
              style={{
                borderColor: active ? cfg.color : 'var(--border)',
                boxShadow:   active ? `0 0 0 2px ${cfg.color}33` : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <span className="text-2xl font-bold" style={{ color: cfg.color }}>
                  {counts[key]}
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {cfg.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Scatter plot */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <Crosshair size={16} style={{ color: 'var(--sanlam-teal)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Attention Quadrant
          </h2>
          <span className="text-[11px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            X = Overall Score · Y = Attention Needed
          </span>
        </div>

        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <svg
            ref={svgRef}
            width={PLOT_W}
            height={PLOT_H}
            style={{ display: 'block', maxWidth: '100%' }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Quadrant backgrounds */}
            <rect x={PAD_L} y={PAD_T} width={DATA_W / 2} height={DATA_H / 2}
              fill="rgba(239,68,68,0.05)" />
            <rect x={PAD_L + DATA_W / 2} y={PAD_T} width={DATA_W / 2} height={DATA_H / 2}
              fill="rgba(245,158,11,0.05)" />
            <rect x={PAD_L} y={PAD_T + DATA_H / 2} width={DATA_W / 2} height={DATA_H / 2}
              fill="rgba(0,181,237,0.05)" />
            <rect x={PAD_L + DATA_W / 2} y={PAD_T + DATA_H / 2} width={DATA_W / 2} height={DATA_H / 2}
              fill="rgba(0,166,81,0.05)" />

            {/* Quadrant dividers */}
            <line
              x1={PAD_L + DATA_W / 2} y1={PAD_T}
              x2={PAD_L + DATA_W / 2} y2={PAD_T + DATA_H}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3"
            />
            <line
              x1={PAD_L} y1={PAD_T + DATA_H / 2}
              x2={PAD_L + DATA_W} y2={PAD_T + DATA_H / 2}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3"
            />

            {/* Quadrant labels */}
            <text x={PAD_L + 6} y={PAD_T + 14} fontSize={10} fill="#EF4444" opacity={0.7} fontWeight={600}>Priority</text>
            <text x={PAD_L + DATA_W / 2 + 6} y={PAD_T + 14} fontSize={10} fill="#F59E0B" opacity={0.7} fontWeight={600}>Watch</text>
            <text x={PAD_L + 6} y={PAD_T + DATA_H / 2 + 14} fontSize={10} fill="#00B5ED" opacity={0.7} fontWeight={600}>Coaching</text>
            <text x={PAD_L + DATA_W / 2 + 6} y={PAD_T + DATA_H / 2 + 14} fontSize={10} fill="#00A651" opacity={0.7} fontWeight={600}>On Track</text>

            {/* Axes */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + DATA_H} stroke="var(--border)" strokeWidth={1} />
            <line x1={PAD_L} y1={PAD_T + DATA_H} x2={PAD_L + DATA_W} y2={PAD_T + DATA_H} stroke="var(--border)" strokeWidth={1} />

            {/* X axis ticks — score scale 1.0–3.0 */}
            {[1.0, 1.5, 2.0, 2.5, 3.0].map(v => (
              <g key={v}>
                <line
                  x1={scoreToX(v)} y1={PAD_T + DATA_H}
                  x2={scoreToX(v)} y2={PAD_T + DATA_H + 4}
                  stroke="var(--border)" strokeWidth={1}
                />
                <text x={scoreToX(v)} y={PAD_T + DATA_H + 14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{v.toFixed(1)}</text>
              </g>
            ))}

            {/* Y axis ticks */}
            {[0, 25, 50, 75, 100].map(v => (
              <g key={v}>
                <line
                  x1={PAD_L - 4} y1={attentionToY(v)}
                  x2={PAD_L}     y2={attentionToY(v)}
                  stroke="var(--border)" strokeWidth={1}
                />
                <text x={PAD_L - 7} y={attentionToY(v) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">{v}</text>
              </g>
            ))}

            {/* Axis labels */}
            <text
              x={PAD_L + DATA_W / 2}
              y={PLOT_H - 4}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-muted)"
            >
              Overall Score →
            </text>

            {/* Dots */}
            {scores.map(s => {
              const cx   = scoreToX(s.currentScore);
              const cy   = attentionToY(s.attentionScore);
              const fill = companyColor(s.companyName);
              const dim  = quadrantFilter !== 'all' && s.quadrant !== quadrantFilter;
              return (
                <g
                  key={s.companyId}
                  style={{ cursor: 'pointer' }}
                  opacity={dim ? 0.2 : 1}
                  onClick={() => router.push(`/company/${s.companyId}`)}
                  onMouseEnter={e => {
                    if (!svgRef.current) return;
                    const rect = svgRef.current.getBoundingClientRect();
                    setTooltip({ score: s, x: cx, y: cy });
                    e.stopPropagation();
                  }}
                >
                  <circle cx={cx} cy={cy} r={18} fill={fill} opacity={0.15} />
                  <circle cx={cx} cy={cy} r={13} fill={fill} />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
                    {initials(s.companyName)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (() => {
            const s   = tooltip.score;
            const cfg = QUADRANT_CONFIG[s.quadrant];
            const tx  = scoreToX(s.currentScore);
            const ty  = attentionToY(s.attentionScore);
            const flip = tx > PLOT_W * 0.65;
            return (
              <div
                style={{
                  position:    'absolute',
                  left:        flip ? tx - 200 : tx + 20,
                  top:         Math.max(4, ty - 60),
                  width:       188,
                  background:  'var(--surface)',
                  border:      '1px solid var(--border)',
                  borderRadius: 12,
                  padding:     '10px 12px',
                  boxShadow:   'var(--shadow-float)',
                  zIndex:       10,
                  pointerEvents: 'none',
                }}
              >
                <p className="font-semibold text-xs mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {s.companyName}
                </p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Score</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.currentScore.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Attention</span>
                    <span style={{ color: cfg.color, fontWeight: 600 }}>{s.attentionScore}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Trend</span>
                    <span style={{ color: s.trend === 'improving' ? '#00A651' : s.trend === 'declining' ? '#EF4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      {s.trend === 'improving' ? '↑ Improving' : s.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] mt-2" style={{ color: 'var(--sanlam-teal)' }}>
                  → {cfg.action}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Company list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {quadrantFilter === 'all' ? 'All Companies' : QUADRANT_CONFIG[quadrantFilter].label} ({filtered.length})
          </h2>
          {quadrantFilter !== 'all' && (
            <button
              onClick={() => setQuadrantFilter('all')}
              className="text-[11px] font-medium"
              style={{ color: 'var(--sanlam-teal)' }}
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map(s => {
            const cfg  = QUADRANT_CONFIG[s.quadrant];
            const fill = companyColor(s.companyName);
            return (
              <button
                key={s.companyId}
                onClick={() => router.push(`/company/${s.companyId}`)}
                className="w-full text-left rounded-xl p-3 transition-colors"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--sanlam-teal)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: fill }}
                  >
                    {initials(s.companyName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.companyName}
                    </p>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: cfg.color }}>{s.attentionScore}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {s.trend === 'improving'
                        ? <TrendingUp size={10} style={{ color: '#00A651' }} />
                        : s.trend === 'declining'
                        ? <TrendingDown size={10} style={{ color: '#EF4444' }} />
                        : <Minus size={10} style={{ color: 'var(--text-muted)' }} />}
                      <p className="text-[10px]" style={{
                        color: s.trend === 'improving' ? '#00A651' : s.trend === 'declining' ? '#EF4444' : 'var(--text-muted)',
                      }}>
                        {s.trend}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <AttentionBar label="Velocity"    value={s.velocity}         color="#00B5ED" />
                  <AttentionBar label="Consistency" value={s.consistency}      color="#6366F1" />
                  <AttentionBar label="Targets"     value={s.targetAttainment} color="#F59E0B" />
                  <AttentionBar label="Data Fill"   value={s.completeness}     color="#00A651" />
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Crosshair size={28} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No companies in this quadrant</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
