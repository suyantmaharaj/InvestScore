'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface Props {
  title:       string;
  helpText:    string;
  calculation: string;
}

export default function HelpChip({ title, helpText, calculation }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-medium hover:underline mt-1 transition"
        style={{ color: 'var(--sanlam-teal, #00B5ED)' }}
        type="button"
      >
        <HelpCircle size={13} />
        {title}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Tooltip card */}
          <div
            className="absolute left-0 top-7 z-50 w-72 rounded-xl shadow-xl p-4"
            style={{
              background: 'var(--c-card, #fff)',
              border:     '1px solid var(--c-border, #DDE3EC)',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--c-navy, #015376)' }}>
                {title}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="flex-shrink-0 transition"
                style={{ color: 'var(--c-muted, #4A5568)' }}
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--c-muted, #4A5568)' }}>
              {helpText}
            </p>
            <div className="rounded-lg p-3" style={{ background: 'var(--c-bg, #F4F6F8)' }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--c-muted, #4A5568)' }}>
                How to calculate
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--c-navy, #015376)' }}>
                {calculation}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
