'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PortfolioStory } from '@/lib/portfolio-stories';

export default function StoryCard({ story, compact = false }: {
  story:    PortfolioStory;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full card text-left p-4 transition-all"
        style={{
          background: 'var(--surface)',
          borderLeft: `4px solid ${story.color}`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${story.color}15`, color: story.color }}
              >
                {story.sector}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {story.location}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {story.title}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {story.company}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-base" style={{ color: story.color }}>
              {story.metric}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {story.metricLabel}
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 space-y-2 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Challenge</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{story.challenge}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>What they did</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{story.action}</p>
            </div>
            <div
              className="p-2.5 rounded-lg"
              style={{ background: `${story.color}0D` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: story.color }}>Outcome</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{story.outcome}</p>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Timeframe: {story.timeframe} · All company names are anonymised
            </p>
          </div>
        )}

        <div className="flex items-center gap-1 mt-2" style={{ color: story.color }}>
          {expanded
            ? <><ChevronUp size={12} /><span className="text-[11px] font-medium">Show less</span></>
            : <><ChevronDown size={12} /><span className="text-[11px] font-medium">Read the full story</span></>
          }
        </div>
      </button>
    );
  }

  return (
    <div
      className="card p-5"
      style={{ background: 'var(--surface)', borderTop: `3px solid ${story.color}` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: `${story.color}15`, color: story.color }}
            >
              {story.sector}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {story.location}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {story.timeframe}
            </span>
          </div>
          <h3 className="font-bold text-base leading-snug" style={{ color: 'var(--text-primary)' }}>
            {story.title}
          </h3>
          <p className="text-xs mt-1 italic" style={{ color: 'var(--text-muted)' }}>
            {story.company}
          </p>
        </div>
        <div
          className="text-center px-4 py-3 rounded-xl flex-shrink-0"
          style={{ background: `${story.color}12`, border: `1px solid ${story.color}30` }}
        >
          <p className="font-bold text-xl" style={{ color: story.color }}>{story.metric}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)', maxWidth: '72px' }}>
            {story.metricLabel}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            The challenge
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {story.challenge}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            What they did
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {story.action}
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: `${story.color}0D`, border: `1px solid ${story.color}20` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: story.color }}>
            The outcome
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {story.outcome}
          </p>
        </div>
      </div>

      <p className="text-[11px] mt-4 pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        All company names and identifying details have been anonymised. Data derived from
        Sanlam Investments 104+ SMME Growth and Empowerment Solution Impact Report (December 2024).
      </p>
    </div>
  );
}
