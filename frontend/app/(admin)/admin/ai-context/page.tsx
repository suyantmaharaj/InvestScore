'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, RefreshCw, Brain, Check } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';

interface AIContext {
  rules:          string[];
  sectorNotes:    Record<string, string>;
  mandateContext: Record<string, string>;
  updatedAt:      string;
  updatedBy:      string;
}

const SECTORS = [
  'financial_services', 'manufacturing', 'ict',
  'housing', 'infrastructure', 'retail', 'logistics',
];

const MANDATES = ['Growth', 'Empowerment', 'Development'];

async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

function formatSector(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AIContextPage() {
  const [context, setContext] = useState<AIContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [newRule, setNewRule] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res  = await apiFetch('/api/admin/ai-context');
      const json = await res.json();
      setContext(json.context || {
        rules: [], sectorNotes: {}, mandateContext: {},
        updatedAt: '', updatedBy: '',
      });
    } catch (err) {
      console.error('Load AI context error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!context) return;
    setSaving(true);
    try {
      await apiFetch('/api/admin/ai-context', {
        method: 'PUT',
        body:   JSON.stringify(context),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save AI context error:', err);
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (!newRule.trim() || !context) return;
    setContext({ ...context, rules: [...context.rules, newRule.trim()] });
    setNewRule('');
  };

  const removeRule = (idx: number) => {
    if (!context) return;
    setContext({ ...context, rules: context.rules.filter((_, i) => i !== idx) });
  };

  const updateRule = (idx: number, value: string) => {
    if (!context) return;
    const updated = [...context.rules];
    updated[idx] = value;
    setContext({ ...context, rules: updated });
  };

  const updateSectorNote = (sector: string, value: string) => {
    if (!context) return;
    setContext({ ...context, sectorNotes: { ...context.sectorNotes, [sector]: value } });
  };

  const updateMandateContext = (mandate: string, value: string) => {
    if (!context) return;
    setContext({ ...context, mandateContext: { ...context.mandateContext, [mandate]: value } });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <SkeletonCard className="h-12" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  const textareaStyle: React.CSSProperties = {
    background:   'var(--bg)',
    border:       '1.5px solid var(--border)',
    color:        'var(--text-primary)',
    borderRadius: '10px',
    padding:      '10px 12px',
    fontSize:     '13px',
    lineHeight:   '1.5',
    width:        '100%',
    resize:       'vertical',
    outline:      'none',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: 'var(--sanlam-teal)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI context applies to all SME coaching sessions
          </span>
        </div>
        {context?.updatedAt && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Last updated:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(context.updatedAt).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </strong>
            </span>
          </>
        )}
      </PageContext>

      {/* Header + save */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          AI Coaching Configuration
        </p>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium animate-fade-in" style={{ color: '#00A651' }}>
              <Check size={13} /> Saved
            </span>
          )}
          <button
            onClick={load}
            className="pressable p-2 rounded-lg transition"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="pressable flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Global rules */}
      <div className="card p-5 animate-card-in" style={{ background: 'var(--surface)', animationDelay: '60ms' }}>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={15} style={{ color: 'var(--sanlam-teal)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Global Coaching Rules
          </p>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          These rules apply to every SME coaching session regardless of sector or mandate.
        </p>

        <div className="space-y-2 mb-4">
          {context?.rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs font-bold mt-2.5 flex-shrink-0 w-5 text-right" style={{ color: 'var(--text-muted)' }}>
                {idx + 1}.
              </span>
              <textarea
                value={rule}
                onChange={e => updateRule(idx, e.target.value)}
                rows={2}
                style={textareaStyle}
              />
              <button
                onClick={() => removeRule(idx)}
                className="pressable mt-2 p-1.5 rounded-lg flex-shrink-0 transition"
                style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRule()}
            placeholder="Add a new coaching rule..."
            style={{
              flex:         1,
              height:       '40px',
              padding:      '0 12px',
              borderRadius: '10px',
              fontSize:     '14px',
              background:   'var(--bg)',
              border:       '1.5px solid var(--border)',
              color:        'var(--text-primary)',
              outline:      'none',
            }}
          />
          <button
            onClick={addRule}
            className="pressable flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
            style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)', border: '1px solid rgba(0,181,237,0.2)' }}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Sector notes */}
      <div className="card p-5 animate-card-in" style={{ background: 'var(--surface)', animationDelay: '120ms' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Sector-Specific Guidance
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Additional coaching instructions applied when a company belongs to a specific sector.
        </p>
        <div className="space-y-4">
          {SECTORS.map(sector => (
            <div key={sector}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {formatSector(sector)}
              </label>
              <textarea
                value={context?.sectorNotes?.[sector] || ''}
                onChange={e => updateSectorNote(sector, e.target.value)}
                rows={3}
                placeholder={`Coaching guidance for ${formatSector(sector)} companies...`}
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mandate context */}
      <div className="card p-5 animate-card-in" style={{ background: 'var(--surface)', animationDelay: '180ms' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Mandate Context
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Instructions for companies under each of the three 104+ investment mandates.
        </p>
        <div className="space-y-4">
          {MANDATES.map(mandate => (
            <div key={mandate}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                {mandate} Mandate
              </label>
              <textarea
                value={context?.mandateContext?.[mandate] || ''}
                onChange={e => updateMandateContext(mandate, e.target.value)}
                rows={3}
                placeholder={`Coaching context for ${mandate} mandate companies...`}
                style={{ ...textareaStyle, minHeight: '80px' }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
