'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Star,
  ExternalLink, Shield, Clock, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import { formatFileSize, getFileIcon } from '@/lib/storage-upload';
import { usePMCompanyDetail } from '@/hooks/usePMData';
import { useWatchlist } from '@/hooks/useWatchlist';
import EngagementLog from '@/components/pm/EngagementLog';
import { SDG_LIST, CLASSIFICATION_COLORS } from '@/lib/sdg';
import { SkeletonCard, SkeletonLine } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { toDisplay } from '@/lib/score';
import AnimatedProgressBar from '@/components/shared/AnimatedProgressBar';
import AnimatedScore from '@/components/shared/AnimatedScore';

type Tab = 'employment' | 'overview' | 'sdg' | 'documents';

function scoreColor(s: number) {
  if (s >= 2.4) return '#00A651';
  if (s >= 1.6) return '#E8A020';
  return '#D0021B';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')   return <TrendingUp   size={14} style={{ color: '#00A651' }} />;
  if (trend === 'down') return <TrendingDown size={14} style={{ color: '#D0021B' }} />;
  return <Minus size={14} style={{ color: 'var(--text-muted)' }} />;
}

function NotYetReported() {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
    >
      Not yet reported
    </span>
  );
}

function MetricRow({
  label,
  value,
  unit = '',
}: {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {value == null ? (
        <NotYetReported />
      ) : (
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
        </span>
      )}
    </div>
  );
}

function MandateBadge({ mandate }: { mandate?: string }) {
  if (!mandate) return null;
  const styles: Record<string, { bg: string; color: string }> = {
    Growth:      { bg: 'rgba(0,181,237,0.12)', color: '#00B5ED' },
    Empowerment: { bg: 'rgba(0,166,81,0.12)',  color: '#00A651' },
    Development: { bg: 'rgba(232,160,32,0.12)', color: '#E8A020' },
  };
  const s = styles[mandate] || styles.Growth;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {mandate}
    </span>
  );
}

/* ── PM Target Setting ── */
function PMTargetPanel({
  companyId,
  scorecard,
}: {
  companyId: string;
  scorecard: NonNullable<ReturnType<typeof usePMCompanyDetail>['scorecard']>;
}) {
  const [targets,  setTargets]  = useState<Record<string, number>>({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/targets/${companyId}`,
          { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setTargets(json.targets || {});
      } catch (err) {
        console.error('Load targets error:', err);
      }
    };
    load();
  }, [companyId]);

  const saveTargets = async () => {
    setSaving(true);
    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/targets/${companyId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ targets }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save targets error:', err);
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...scorecard.sdgScores].sort((a, b) => a.sdgId - b.sdgId);

  return (
    <div className="card" style={{ background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 pressable"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            SDG Targets
          </p>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}>
            PM-set
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {expanded ? 'Collapse' : 'Set targets'}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 animate-card-in" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs mt-4 mb-3" style={{ color: 'var(--text-muted)' }}>
            Set target scores (out of 100) for each SDG. These will appear as benchmarks on the SME's scorecard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {sorted.map(s => {
              const current = toDisplay(s.score);
              const target  = targets[String(s.sdgId)] ?? 0;
              const sdgMeta = SDG_LIST.find(d => d.id === s.sdgId);
              return (
                <div
                  key={s.sdgId}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span className="text-base flex-shrink-0">{sdgMeta?.icon ?? '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      SDG {s.sdgId}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Now: {current}/100
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={target || ''}
                    onChange={e => setTargets(t => ({ ...t, [String(s.sdgId)]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                    placeholder="-"
                    className="w-14 h-8 text-center text-sm font-semibold rounded-lg focus:outline-none"
                    style={{
                      background:  'var(--surface)',
                      border:      '1.5px solid var(--border)',
                      color:       target > current ? '#00A651' : target > 0 ? '#E8A020' : 'var(--text-muted)',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs font-medium animate-card-in" style={{ color: '#00A651' }}>Saved ✓</span>}
            <button
              onClick={saveTargets}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white pressable disabled:opacity-60"
              style={{ background: 'var(--sanlam-teal)' }}
            >
              {saving ? 'Saving...' : 'Save targets'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PM Notes ── */
function PMNotesSection({ companyId }: { companyId: string }) {
  const [notes,       setNotes]       = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved,  setNotesSaved]  = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/pm/notes/${companyId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        setNotes(json.notes || '');
      } catch (err) {
        console.error('Load PM notes error:', err);
      }
    };
    load();
  }, [companyId]);

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pm/notes/${companyId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Save PM notes error:', err);
    } finally {
      setNotesSaving(false);
    }
  };

  return (
    <div className="card p-5" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          PM Notes
        </p>
        <div className="flex items-center gap-2">
          {notesSaved && (
            <span className="text-xs font-medium animate-card-in" style={{ color: '#00A651' }}>
              Saved
            </span>
          )}
          <button
            onClick={saveNotes}
            disabled={notesSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white pressable disabled:opacity-60"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            {notesSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Add your investment thesis, meeting notes, risk flags, or next steps for this company..."
        rows={5}
        className="w-full rounded-xl text-sm focus:outline-none resize-none"
        style={{
          background: 'var(--bg)',
          border:     '1.5px solid var(--border)',
          color:      'var(--text-primary)',
          padding:    '10px 12px',
          lineHeight: '1.6',
        }}
        onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
        onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
      />
      <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
        Notes are private to Portfolio Managers. Not visible to the company.
      </p>
    </div>
  );
}

/* ── Claude Narrative ── */
function OverviewTab({
  company,
  scorecard,
  companyId,
}: {
  company:    NonNullable<ReturnType<typeof usePMCompanyDetail>['company']>;
  scorecard:  NonNullable<ReturnType<typeof usePMCompanyDetail>['scorecard']>;
  companyId:  string;
}) {
  const [narrative, setNarrative] = useState('');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      setLoading(true);
      setNarrative('');

      const topSDGs = scorecard.sdgScores
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const lowSDGs = scorecard.sdgScores
        .slice()
        .sort((a, b) => a.score - b.score)
        .filter(s => s.score < 1.6)
        .slice(0, 2);

      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        if (!token || cancelled) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/narrative`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ companyId: company.id }),
        });

        const json = await res.json();
        if (!cancelled) setNarrative(json.narrative || json.error || 'Narrative unavailable.');
      } catch {
        if (!cancelled) setNarrative(
          `${company.name} has achieved an overall SDG score of ${toDisplay(scorecard.overallScore)}/100, ` +
          `classified as ${scorecard.classification}. Key strengths are in ` +
          `${topSDGs.map(s => `SDG ${s.sdgId}`).join(' and ')}. ` +
          (lowSDGs.length ? `Areas requiring attention include ${lowSDGs.map(s => `SDG ${s.sdgId}`).join(' and ')}.` : 'Performance is broadly consistent across all measured goals.')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [company.id]);

  return (
    <div className="space-y-6 animate-page-in">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI Investment Narrative
          </h3>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto"
            style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
          >
            Claude-powered
          </span>
        </div>

        {loading && !narrative ? (
          <div className="space-y-2.5">
            <SkeletonLine w="w-full"  h="h-4" />
            <SkeletonLine w="w-5/6"  h="h-4" />
            <SkeletonLine w="w-full"  h="h-4" />
            <SkeletonLine w="w-4/5"  h="h-4" />
            <SkeletonLine w="w-full"  h="h-4" />
            <SkeletonLine w="w-3/4"  h="h-4" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {narrative}
          </p>
        )}
      </div>

      {/* Company info card */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Company Profile</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          {company.description || 'No description available.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Sector',   value: company.sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
            { label: 'Location', value: company.location },
            { label: 'Mandate',  value: company.mandate ?? '-' },
            { label: 'B-BBEE',   value: company.bbbeeLevel ? `Level ${company.bbbeeLevel}` : '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Log - replaces freeform notes */}
      <EngagementLog companyId={companyId} />

      {/* PM Targets */}
      <PMTargetPanel companyId={companyId} scorecard={scorecard} />
    </div>
  );
}

/* ── SDG Scorecard Tab ── */
function SDGTab({ scorecard }: { scorecard: NonNullable<ReturnType<typeof usePMCompanyDetail>['scorecard']> }) {
  const sorted = [...scorecard.sdgScores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3 animate-page-in">
      {sorted.map((s, i) => {
        const sdg = SDG_LIST.find(d => d.id === s.sdgId);
        const cc  = CLASSIFICATION_COLORS[s.classification];
        const pct = ((s.score - 1) / 2) * 100;
        const avgPct = ((s.sectorAvg - 1) / 2) * 100;

        return (
          <div
            key={s.sdgId}
            className="card p-4 animate-card-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${sdg?.color ?? '#888'}20` }}
              >
                {sdg?.icon ?? '🎯'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    SDG {s.sdgId}: {s.sdgName}
                  </p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
                  >
                    {s.classification}
                  </span>
                  <TrendIcon trend={s.trend} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: scoreColor(s.score) }}>
                    {toDisplay(s.score)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                  <span className="text-xs mx-1" style={{ color: 'var(--border)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sector avg: {toDisplay(s.sectorAvg)}
                  </span>
                </div>

                {/* Progress vs sector avg */}
                <div className="relative">
                  <AnimatedProgressBar
                    value={pct}
                    color={scoreColor(s.score)}
                    height={6}
                    delay={i * 40 + 150}
                  />
                  {/* Sector avg marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 rounded"
                    style={{
                      left:       `${Math.min(avgPct, 98)}%`,
                      background: 'var(--text-muted)',
                      opacity:    0.5,
                    }}
                  />
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Dashed line = sector average
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Employment & Transformation Tab ── */
function EmploymentTab({
  company,
  scorecard,
  submission,
}: {
  company:    NonNullable<ReturnType<typeof usePMCompanyDetail>['company']>;
  scorecard:  NonNullable<ReturnType<typeof usePMCompanyDetail>['scorecard']>;
  submission: Record<string, number | null> | null;
}) {
  const d = submission ?? {};

  const sdg8  = scorecard.sdgScores.find(s => s.sdgId === 8);
  const sdg10 = scorecard.sdgScores.find(s => s.sdgId === 10);

  return (
    <div className="space-y-6 animate-page-in">

      {/* SDG 8 + 10 score summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { sdg: sdg8,  label: 'SDG 8 – Decent Work',       icon: '💼' },
          { sdg: sdg10, label: 'SDG 10 – Reduced Inequality', icon: '⚖️' },
        ].map(({ sdg, label, icon }) => (
          <div key={label} className="card p-4">
            <p className="text-lg mb-1">{icon}</p>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            {sdg ? (
              <>
                <AnimatedScore
                  value={sdg.score}
                  className="font-bold text-2xl block"
                  style={{ color: scoreColor(sdg.score) }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>/100</p>
                <div className="mt-2">
                  <AnimatedProgressBar
                    value={((sdg.score - 1) / 2) * 100}
                    color={scoreColor(sdg.score)}
                    height={5}
                    delay={200}
                  />
                </div>
              </>
            ) : (
              <NotYetReported />
            )}
          </div>
        ))}
      </div>

      {/* Employment KPIs */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Employment Metrics
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>From latest submitted impact report</p>
        <MetricRow label="Total Employees"           value={d.total_employees}            />
        <MetricRow label="New Jobs Created"          value={d.new_jobs_created}           />
        <MetricRow label="Youth Employed (18–35)"    value={d.youth_employed}             />
        <MetricRow label="Women Employed"            value={d.women_employed}             />
        <MetricRow label="Employees with Disability" value={d.employees_with_disability}  />
        <MetricRow label="Training Hours Delivered"  value={d.training_hours}  unit="hrs" />
        <MetricRow label="Training Spend"            value={d.training_spend != null ? `R${d.training_spend.toLocaleString()}` : null} />
        <MetricRow label="Living Wage Compliance"    value={d.living_wage_compliance != null ? `${d.living_wage_compliance}%` : null} />
        <MetricRow label="Staff Turnover Rate"       value={d.staff_turnover != null ? `${d.staff_turnover}%` : null} />
      </div>

      {/* Transformation KPIs */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Transformation & Governance
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>B-BBEE and ownership metrics</p>
        <MetricRow label="B-BBEE Level"             value={company.bbbeeLevel ? `Level ${company.bbbeeLevel}` : null} />
        <MetricRow label="Black Ownership %"        value={d.black_ownership != null ? `${d.black_ownership}%` : null} />
        <MetricRow label="Black Female Ownership %" value={d.black_female_ownership != null ? `${d.black_female_ownership}%` : null} />
        <MetricRow label="Black Management %"       value={d.black_management != null ? `${d.black_management}%` : null} />
        <MetricRow label="Black Board Representation" value={d.black_board_representation != null ? `${d.black_board_representation}%` : null} />
        <MetricRow label="Procurement from Black-owned" value={d.procurement_black_owned != null ? `${d.procurement_black_owned}%` : null} />
        <MetricRow label="Enterprise Development Spend" value={d.enterprise_development_spend != null ? `R${d.enterprise_development_spend.toLocaleString()}` : null} />
      </div>

    </div>
  );
}

/* ── Documents Tab ── */
function DocumentsTab({ companyId }: { companyId: string }) {
  const [documents,   setDocuments]   = useState<any[]>([]);
  const [bbbeeVerifs, setBbbeeVerifs] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const [docsRes, bbRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${companyId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${companyId}/bbbee`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const [docsJson, bbJson] = await Promise.all([docsRes.json(), bbRes.json()]);
        setDocuments(docsJson.documents || []);
        setBbbeeVerifs(bbJson.verifications || []);
      } catch (err) {
        console.error('Load documents error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-20" />)}
      </div>
    );
  }

  const latestBBBEE = bbbeeVerifs[0] ?? null;
  const statusConfig = {
    pending:    { color: '#E8A020', Icon: Clock,         label: 'Awaiting verification' },
    approved:   { color: '#00A651', Icon: CheckCircle,   label: 'Verified'              },
    rejected:   { color: '#D0021B', Icon: XCircle,       label: 'Rejected'              },
    superseded: { color: '#4A5568', Icon: AlertTriangle, label: 'Superseded'            },
  };

  return (
    <div className="space-y-6 animate-page-in">

      {/* B-BBEE Certificate section */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} style={{ color: 'var(--sanlam-teal)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            B-BBEE Certificate
          </h3>
        </div>

        {bbbeeVerifs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No B-BBEE certificate uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {bbbeeVerifs.map(v => {
              const cfg = statusConfig[v.status as keyof typeof statusConfig] || statusConfig.pending;
              const { Icon } = cfg;
              return (
                <div
                  key={v.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: `${cfg.color}06`,
                    border:     `1px solid ${cfg.color}20`,
                  }}
                >
                  <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold" style={{ color: cfg.color }}>
                        Level {v.claimedLevel} — {cfg.label}
                      </p>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {v.originalName}
                      </span>
                    </div>
                    {v.status === 'rejected' && v.rejectionReason && (
                      <p className="text-xs mt-0.5" style={{ color: '#D0021B' }}>
                        Reason: {v.rejectionReason}
                      </p>
                    )}
                    {v.status === 'approved' && v.reviewedAt && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Verified {new Date(v.reviewedAt).toLocaleDateString('en-ZA', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(v.fileSize)} ·{' '}
                      Submitted {new Date(v.submittedAt).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <a
                    href={v.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg flex-shrink-0"
                    style={{ color: 'var(--sanlam-teal)' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supporting Documents section */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Supporting Documents
        </h3>

        {documents.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No documents uploaded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg)' }}
              >
                <span className="text-xl flex-shrink-0">{getFileIcon(doc.originalName)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {doc.originalName}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {doc.description && `${doc.description} · `}
                    {formatFileSize(doc.fileSize)} ·{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString('en-ZA', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ color: 'var(--sanlam-teal)' }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Main Page ── */
export default function CompanyDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = typeof params.id === 'string' ? params.id : '';
  const [tab, setTab] = useState<Tab>('employment');

  const { company, scorecard, submission, loading, error } = usePMCompanyDetail(id);
  const { toggle: toggleWatch, isWatched } = useWatchlist();

  const TABS: { key: Tab; label: string }[] = [
    { key: 'employment', label: 'Employment & Transformation' },
    { key: 'overview',   label: 'Overview'                    },
    { key: 'sdg',        label: 'SDG Scorecard'               },
    { key: 'documents',  label: 'Documents'                   },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonCard className="h-28" />
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <EmptyState
        icon="🏢"
        title="Company not found"
        description="This company does not exist or could not be loaded."
        action={<button className="btn-primary" onClick={() => router.back()}>Go back</button>}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm pressable"
        style={{ color: 'var(--text-muted)', transition: 'color 150ms var(--ease-out), opacity 160ms var(--ease-out)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <ArrowLeft size={15} />
        Back to portfolio
      </button>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: 'var(--sanlam-navy)' }}
          >
            {company.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {company.name}
              </h1>
              <MandateBadge mandate={company.mandate} />
              {company.bbbeeLevel && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
                >
                  B-BBEE L{company.bbbeeLevel}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {company.sector.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · {company.location}
            </p>
          </div>

          {/* Watch star + score */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <button
              onClick={() => toggleWatch(id)}
              className="p-2 rounded-xl pressable mt-1"
              style={{
                background: isWatched(id) ? 'rgba(212,175,55,0.15)' : 'var(--bg)',
                color:      isWatched(id) ? '#B8860B'                : 'var(--text-muted)',
                border:     `1px solid ${isWatched(id) ? '#B8860B' : 'var(--border)'}`,
                transition: 'all 150ms var(--ease-out)',
              }}
            >
              <Star size={16} fill={isWatched(id) ? '#B8860B' : 'none'} />
            </button>

            {scorecard && (
              <div className="text-right">
                <AnimatedScore
                  value={scorecard.overallScore}
                  className="font-bold text-3xl block leading-none"
                  style={{ color: scoreColor(scorecard.overallScore) }}
                />
                <p className="text-xs mt-0.5 mb-2" style={{ color: 'var(--text-muted)' }}>/100</p>
                {(() => {
                  const cc = CLASSIFICATION_COLORS[scorecard.classification];
                  return (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
                    >
                      {scorecard.classification}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0.5 p-1 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', display: 'inline-flex' }}
      >
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm font-medium rounded-lg pressable"
            style={{
              background: tab === t.key ? 'var(--sanlam-navy)' : 'transparent',
              color:      tab === t.key ? 'white'               : 'var(--text-muted)',
              transition: 'background 150ms var(--ease-out), color 150ms var(--ease-out)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'documents' ? (
        <DocumentsTab companyId={id} />
      ) : !scorecard ? (
        <EmptyState
          icon="📊"
          title="No scorecard data"
          description="This company has not submitted an impact report yet."
        />
      ) : (
        <>
          {tab === 'employment' && (
            <EmploymentTab company={company} scorecard={scorecard} submission={submission} />
          )}
          {tab === 'overview' && (
            <OverviewTab company={company} scorecard={scorecard} companyId={id} />
          )}
          {tab === 'sdg' && (
            <SDGTab scorecard={scorecard} />
          )}
        </>
      )}

    </div>
  );
}
