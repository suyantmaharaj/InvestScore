'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Zap, TrendingUp } from 'lucide-react';

interface ImprovementAction {
  sdgId:        number;
  sdgName:      string;
  priority:     'critical' | 'high' | 'medium';
  effort:       'low' | 'medium' | 'high';
  timeframe:    string;
  action:       string;
  why:          string;
  kpiImpact:    string;
  expectedGain: string;
}

interface ImprovementPlanData {
  summary:     string;
  actions:     ImprovementAction[];
  generatedAt: string;
}

async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token = await auth.currentUser?.getIdToken();
  if (!token) return null;

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

const PRIORITY_STYLE = {
  critical: { bg: 'rgba(208,2,27,0.08)', color: '#D0021B', label: 'Critical', border: 'rgba(208,2,27,0.2)' },
  high: { bg: 'rgba(232,160,32,0.10)', color: '#E8A020', label: 'High', border: 'rgba(232,160,32,0.25)' },
  medium: { bg: 'rgba(0,181,237,0.08)', color: '#00B5ED', label: 'Medium', border: 'rgba(0,181,237,0.2)' },
};

const EFFORT_STYLE = {
  low: { label: 'Quick win', color: '#00A651' },
  medium: { label: '~1 month', color: '#E8A020' },
  high: { label: '3+ months', color: '#4A5568' },
};

export default function ImprovementPlan({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<ImprovementPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/api/ai/improvement-plan/${companyId}`);
        if (!res) return;
        const json = await res.json();
        if (json.plan) setPlan(json.plan);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch('/api/ai/improvement-plan', {
        method: 'POST',
        body: JSON.stringify({ companyId }),
      });
      if (!res) return;
      const json = await res.json();
      if (json.plan) setPlan(json.plan);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading) return null;

  return (
    <div className="card p-5" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} style={{ color: '#E8A020' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Improvement Plan
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
          style={{
            background: generating ? 'var(--bg)' : 'rgba(0,181,237,0.1)',
            color: generating ? 'var(--text-muted)' : 'var(--sanlam-teal)',
            border: `1px solid ${generating ? 'var(--border)' : 'rgba(0,181,237,0.2)'}`,
          }}
        >
          {generating
            ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
            : <><Sparkles size={12} /> {plan ? 'Refresh' : 'Generate plan'}</>
          }
        </button>
      </div>

      {!plan && !generating && (
        <div className="text-center py-8 rounded-xl" style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
          <Zap size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            No improvement plan yet
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Generate AI-powered action steps for your low-scoring goals.
          </p>
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--sanlam-teal)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Analysing your scores and building your action plan...
          </p>
        </div>
      )}

      {plan && !generating && (
        <div className="animate-fade-in">
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            {plan.summary}
          </p>

          {plan.actions.length === 0 ? (
            <div className="p-4 rounded-xl text-sm text-center" style={{ background: 'rgba(0,166,81,0.08)', color: '#00A651' }}>
              No Low Impact goals. Focus on pushing Medium goals higher.
            </div>
          ) : (
            <div className="space-y-2">
              {plan.actions.map((action, idx) => {
                const ps = PRIORITY_STYLE[action.priority] || PRIORITY_STYLE.medium;
                const es = EFFORT_STYLE[action.effort] || EFFORT_STYLE.medium;
                const open = expanded.has(idx);

                return (
                  <div
                    key={`${action.sdgId}-${idx}`}
                    className="rounded-xl overflow-hidden transition-all duration-150"
                    style={{
                      border: `1px solid ${ps.border}`,
                      background: open ? ps.bg : 'var(--bg)',
                    }}
                  >
                    <button onClick={() => toggleExpand(idx)} className="w-full flex items-start gap-3 p-3 text-left">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                        style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}
                      >
                        {ps.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-semibold" style={{ color: ps.color }}>
                            SDG {action.sdgId} - {action.sdgName}
                          </span>
                          <span className="text-[10px] font-medium" style={{ color: es.color }}>
                            {es.label}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {action.timeframe}
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                          {action.action}
                        </p>
                      </div>
                      {open
                        ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      }
                    </button>

                    {open && (
                      <div className="px-3 pb-3 animate-fade-in" style={{ borderTop: `1px solid ${ps.border}` }}>
                        <div className="pt-3 space-y-2">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Why this works:</span>{' '}
                            {action.why}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>KPI impact:</span>{' '}
                            {action.kpiImpact}
                          </p>
                          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(0,166,81,0.08)' }}>
                            <TrendingUp size={12} style={{ color: '#00A651' }} />
                            <p className="text-xs font-medium" style={{ color: '#00A651' }}>
                              {action.expectedGain}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/coach?prompt=${encodeURIComponent(`Help me action this: ${action.action}`)}`)}
                            className="text-xs font-medium hover:underline"
                            style={{ color: 'var(--sanlam-teal)' }}
                          >
                            Ask AI Coach about this step →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Generated {new Date(plan.generatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' | '}Advisory only | Based on Sanlam proprietary scoring
          </p>
        </div>
      )}
    </div>
  );
}
