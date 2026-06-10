'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, TrendingUp, Database, BarChart2 } from 'lucide-react';
import { getKPIContext } from '@/lib/kpi-context';

interface Props {
  kpiId:       string;
  description: string;
}

export default function HelpChip({ kpiId, description }: Props) {
  const [open, setOpen] = useState(false);
  const ctx = getKPIContext(kpiId);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs font-medium transition"
        style={{ color: 'var(--sanlam-teal, #00B5ED)' }}
      >
        <HelpCircle size={13} />
        {open ? 'Hide guidance' : 'Why is this asked?'}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div
          className="mt-2 rounded-xl overflow-hidden animate-fade-in"
          style={{ border: '1px solid var(--border, #DDE3EC)', background: 'var(--bg, #F4F6F8)' }}
        >
          {/* Short description */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border, #DDE3EC)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted, #4A5568)' }}>
              {description}
            </p>
          </div>

          {ctx && (
            <>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border, #DDE3EC)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={11} style={{ color: 'var(--sanlam-teal, #00B5ED)', flexShrink: 0 }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sanlam-teal, #00B5ED)' }}>
                    Why Sanlam tracks this
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary, #015376)', lineHeight: '1.6' }}>
                  {ctx.whySanlam}
                </p>
              </div>

              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border, #DDE3EC)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Database size={11} style={{ color: '#E8A020', flexShrink: 0 }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#E8A020' }}>
                    How to find this data
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary, #015376)', lineHeight: '1.6' }}>
                  {ctx.howToCollect}
                </p>
              </div>

              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart2 size={11} style={{ color: '#00A651', flexShrink: 0 }} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#00A651' }}>
                    Typical range in the portfolio
                  </p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary, #015376)', lineHeight: '1.6' }}>
                  {ctx.typicalRange}
                </p>
                <p className="text-xs italic mt-1" style={{ color: 'var(--text-muted, #4A5568)' }}>
                  Example: {ctx.example}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
