'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Phone, MapPin, Mail, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const LOG_TYPES = [
  { value: 'meeting',    label: 'Meeting',    icon: MessageSquare },
  { value: 'call',       label: 'Call',       icon: Phone },
  { value: 'site_visit', label: 'Site Visit', icon: MapPin },
  { value: 'email',      label: 'Email',      icon: Mail },
] as const;

type LogType = typeof LOG_TYPES[number]['value'];

const TYPE_COLORS: Record<string, string> = {
  meeting:    '#00B5ED',
  call:       '#00A651',
  site_visit: '#E8A020',
  email:      '#6366F1',
};

interface EngagementEntry {
  id:          string;
  companyId:   string;
  type:        LogType;
  date:        string;
  notes:       string;
  commitments: string[];
  createdAt:   string;
  createdBy:   string;
}

async function getToken(): Promise<string | undefined> {
  const { auth } = await import('@/lib/firebase');
  return auth.currentUser?.getIdToken();
}

export default function EngagementLog({ companyId }: { companyId: string }) {
  const [entries,  setEntries]  = useState<EngagementEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [formType,        setFormType]        = useState<LogType>('meeting');
  const [formDate,        setFormDate]        = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes,       setFormNotes]       = useState('');
  const [formCommitments, setFormCommitments] = useState<string[]>(['']);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res  = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/engagement/${companyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        setEntries(json.entries ?? []);
      } catch (err) {
        console.error('Load engagement log error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const submit = async () => {
    if (!formDate) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/engagement`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyId,
          type:        formType,
          date:        formDate,
          notes:       formNotes,
          commitments: formCommitments.filter(c => c.trim()),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        const newEntry: EngagementEntry = {
          id:          json.id,
          companyId,
          type:        formType,
          date:        formDate,
          notes:       formNotes,
          commitments: formCommitments.filter(c => c.trim()),
          createdAt:   new Date().toISOString(),
          createdBy:   '',
        };
        setEntries(prev => [newEntry, ...prev]);
        setAdding(false);
        setFormType('meeting');
        setFormDate(new Date().toISOString().slice(0, 10));
        setFormNotes('');
        setFormCommitments(['']);
      }
    } catch (err) {
      console.error('Save engagement log error:', err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entryId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/engagement/${entryId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (err) {
      console.error('Delete engagement log error:', err);
    }
  };

  return (
    <div className="card" style={{ background: 'var(--surface)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Engagement Log
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Private to Portfolio Managers
          </p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white pressable"
          style={{ background: 'var(--sanlam-teal)' }}
        >
          <Plus size={12} />
          Log interaction
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div
          className="p-5 animate-card-in"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
        >
          <div className="grid grid-cols-2 gap-4 mb-3">

            {/* Type buttons */}
            <div>
              <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LOG_TYPES.map(t => {
                  const active = formType === t.value;
                  const color  = TYPE_COLORS[t.value];
                  return (
                    <button
                      key={t.value}
                      onClick={() => setFormType(t.value)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium pressable"
                      style={{
                        background:  active ? `${color}22` : 'var(--surface)',
                        color:       active ? color          : 'var(--text-muted)',
                        border:      `1px solid ${active ? color : 'var(--border)'}`,
                        transition:  'all 120ms var(--ease-out)',
                      }}
                    >
                      <t.icon size={11} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="h-8 px-2 rounded-lg text-xs focus:outline-none w-full"
                style={{
                  background: 'var(--surface)',
                  border:     '1px solid var(--border)',
                  color:      'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
            Notes
          </label>
          <textarea
            value={formNotes}
            onChange={e => setFormNotes(e.target.value)}
            placeholder="Discussion points, outcomes, context..."
            rows={3}
            className="w-full rounded-xl text-xs focus:outline-none resize-none mb-3"
            style={{
              background: 'var(--surface)',
              border:     '1.5px solid var(--border)',
              color:      'var(--text-primary)',
              padding:    '8px 10px',
              lineHeight: '1.6',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--sanlam-teal)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />

          {/* Commitments */}
          <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
            Commitments / follow-ups
          </label>
          <div className="space-y-1.5 mb-3">
            {formCommitments.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={c}
                  onChange={e => {
                    const next = [...formCommitments];
                    next[i] = e.target.value;
                    setFormCommitments(next);
                  }}
                  placeholder={`Action item ${i + 1}...`}
                  className="flex-1 h-7 px-2 rounded-lg text-xs focus:outline-none"
                  style={{
                    background: 'var(--surface)',
                    border:     '1px solid var(--border)',
                    color:      'var(--text-primary)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--sanlam-teal)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                />
                {formCommitments.length > 1 && (
                  <button
                    onClick={() => setFormCommitments(prev => prev.filter((_, j) => j !== i))}
                    className="pressable flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setFormCommitments(prev => [...prev, ''])}
              className="text-[11px] font-medium pressable"
              style={{ color: 'var(--sanlam-teal)' }}
            >
              + Add item
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs rounded-lg pressable"
              style={{
                color:      'var(--text-muted)',
                background: 'var(--surface)',
                border:     '1px solid var(--border)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving || !formDate}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg pressable disabled:opacity-60"
              style={{ background: 'var(--sanlam-teal)' }}
            >
              {saving ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        </div>
      )}

      {/* Entry list */}
      {loading ? (
        <div className="p-5 text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            No interactions logged yet
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Log your first meeting, call, or site visit above
          </p>
        </div>
      ) : (
        <div>
          {entries.map((entry, idx) => {
            const isOpen = !!expanded[entry.id];
            const color  = TYPE_COLORS[entry.type] ?? '#00B5ED';
            const typeLabel = LOG_TYPES.find(t => t.value === entry.type)?.label ?? entry.type;
            const TypeIconComp = LOG_TYPES.find(t => t.value === entry.type)?.icon ?? MessageSquare;

            return (
              <div
                key={entry.id}
                className="animate-card-in"
                style={{
                  borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                {/* Row */}
                <button
                  onClick={() => setExpanded(e => ({ ...e, [entry.id]: !e[entry.id] }))}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left pressable"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}1a`, color }}
                  >
                    <TypeIconComp size={13} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {typeLabel}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {new Date(entry.date).toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    {entry.notes && !isOpen && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {entry.notes}
                      </p>
                    )}
                    {entry.commitments.length > 0 && !isOpen && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 inline-block"
                        style={{ background: `${color}15`, color }}
                      >
                        {entry.commitments.length} commitment{entry.commitments.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {isOpen
                    ? <ChevronUp  size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    : <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-4 animate-card-in" style={{ background: 'var(--bg)' }}>
                    {entry.notes && (
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}
                      >
                        {entry.notes}
                      </p>
                    )}
                    {entry.commitments.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          Commitments
                        </p>
                        <ul className="space-y-1">
                          {entry.commitments.map((c, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-[11px]"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <span className="mt-0.5 flex-shrink-0" style={{ color }}>•</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {entry.createdBy ? `Logged by ${entry.createdBy}` : ''}
                      </span>
                      <button
                        onClick={() => remove(entry.id)}
                        className="flex items-center gap-1 text-[10px] font-medium pressable"
                        style={{ color: '#D0021B' }}
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
