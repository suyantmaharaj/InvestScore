'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save, RotateCcw, AlertTriangle, CheckCircle, History,
  ChevronDown, ChevronRight, Info,
} from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext       from '@/components/shared/PageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectorKey =
  | 'financial_services' | 'infrastructure' | 'manufacturing'
  | 'housing' | 'ict' | 'retail' | 'logistics' | 'other';

const SECTORS: { key: SectorKey; label: string }[] = [
  { key: 'financial_services', label: 'Financial Services' },
  { key: 'infrastructure',     label: 'Infrastructure'     },
  { key: 'manufacturing',      label: 'Manufacturing'      },
  { key: 'housing',            label: 'Housing'            },
  { key: 'ict',                label: 'ICT'                },
  { key: 'retail',             label: 'Retail'             },
  { key: 'logistics',          label: 'Logistics'          },
  { key: 'other',              label: 'Other'              },
];

const INVERTED_KPIS = new Set([
  'scope1_co2e', 'scope2_co2e', 'total_water_consumption',
  'electricity_consumption', 'bbbee_rating', 'average_cost_of_service',
  'social_housing_rental_avg',
]);

const KPI_GROUPS: Record<string, string[]> = {
  'Employment': [
    'total_employees', 'youth_employees', 'management_employees', 'staff_employees',
    'contractor_employees', 'female_employees', 'male_employees', 'black_employees',
    'white_employees', 'coloured_employees', 'indian_employees',
  ],
  'Environmental': [
    'recycled_waste_pct', 'scope1_co2e', 'scope2_co2e', 'renewable_energy_produced',
    'renewable_energy_utilised', 'total_water_consumption', 'total_energy_consumption_renewable',
    'electricity_consumption',
  ],
  'Transformation': [
    'bbbee_rating', 'black_ownership_pct', 'black_female_ownership_pct', 'black_board_pct',
    'black_board_number', 'procurement_black_owned_pct', 'procurement_women_owned_pct',
    'total_annual_revenue',
  ],
  'Community': [
    'csi_spend', 'local_suppliers', 'smes_in_supply_chain',
  ],
  'Financial Services': [
    'smes_funded', 'black_smes_funded_pct', 'women_led_smes_funded_pct',
    'capital_deployed_smes', 'jobs_supported_smes',
  ],
  'Manufacturing': [
    'units_produced', 'manufacturing_revenue_pct', 'local_raw_material_pct', 'apprentices_supported',
  ],
  'Retail': [
    'products_local_producers_pct', 'low_income_customers', 'sustainable_products_pct',
  ],
  'ICT': [
    'spectrum_units', 'new_customers_connected', 'geographic_coverage_km2', 'average_cost_of_service',
  ],
  'Housing': [
    'affordable_houses', 'social_housing_rental_avg', 'social_housing_units',
  ],
  'Water': [
    'water_loss_reduction_pct', 'water_supplied_treated', 'water_connections',
  ],
  'Logistics': [
    'port_pairs_routes', 'road_rail_share_pct', 'tonnage_passengers_transported',
  ],
};

function kpiLabel(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface ScoringConfig {
  sectorWeights: Record<string, Record<string, number>>;
  kpiThresholds: Record<string, { low: number; high: number }>;
  isDefault:     boolean;
  updatedAt:     string | null;
  updatedBy:     string | null;
  history:       HistoryEntry[];
}

interface HistoryEntry {
  changedAt:    string;
  changedBy:    string;
  reason:       string;
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      ...(opts?.headers || {}),
    },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 pressable"
      style={{
        background: active ? 'var(--sanlam-teal)' : 'transparent',
        color:      active ? '#fff' : 'var(--text-muted)',
        border:     `1px solid ${active ? 'var(--sanlam-teal)' : 'var(--border)'}`,
      }}
    >
      {children}
    </button>
  );
}

// ─── Thresholds tab ───────────────────────────────────────────────────────────

function ThresholdsTab({
  thresholds,
  onChange,
}: {
  thresholds: Record<string, { low: number; high: number }>;
  onChange:   (kpiId: string, field: 'low' | 'high', value: number) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Employment: true, Transformation: true,
  });

  const toggleGroup = (g: string) =>
    setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Thresholds define when a KPI scores Low (1), Medium (2), or High (3).
        For <span className="font-semibold" style={{ color: 'var(--sanlam-teal)' }}>inverted KPIs</span> (↓),
        lower values are better.
      </p>

      {Object.entries(KPI_GROUPS).map(([group, kpiIds]) => {
        const present = kpiIds.filter(id => thresholds[id]);
        if (!present.length) return null;
        const isOpen = openGroups[group] ?? false;

        return (
          <div key={group} className="card overflow-hidden" style={{ background: 'var(--surface)' }}>
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {group}
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  {present.length} KPI{present.length !== 1 ? 's' : ''}
                </span>
              </span>
              {isOpen
                ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)', width: '40%' }}>KPI</th>
                      <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Low threshold</th>
                      <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>High threshold</th>
                      <th className="text-center px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {present.map((kpiId, i) => {
                      const t        = thresholds[kpiId];
                      const inverted = INVERTED_KPIS.has(kpiId);
                      return (
                        <tr
                          key={kpiId}
                          style={{ borderBottom: i < present.length - 1 ? '1px solid var(--border)' : 'none' }}
                        >
                          <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kpiLabel(kpiId)}
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={t.low}
                              onChange={e => onChange(kpiId, 'low', Number(e.target.value))}
                              className="w-28 rounded-lg px-2.5 py-1.5 text-xs text-right"
                              style={{
                                background: 'var(--bg)',
                                border:     '1px solid var(--border)',
                                color:      'var(--text-primary)',
                                outline:    'none',
                              }}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={t.high}
                              onChange={e => onChange(kpiId, 'high', Number(e.target.value))}
                              className="w-28 rounded-lg px-2.5 py-1.5 text-xs text-right"
                              style={{
                                background: 'var(--bg)',
                                border:     '1px solid var(--border)',
                                color:      'var(--text-primary)',
                                outline:    'none',
                              }}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: inverted ? 'rgba(208,2,27,0.08)' : 'rgba(0,166,81,0.08)',
                                color:      inverted ? '#D0021B' : '#00A651',
                              }}
                            >
                              {inverted ? '↓ Lower = Better' : '↑ Higher = Better'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sector Weights tab ───────────────────────────────────────────────────────

function WeightsTab({
  weights,
  onChange,
}: {
  weights:  Record<string, Record<string, number>>;
  onChange: (sector: string, kpiId: string, value: number) => void;
}) {
  const [activeSector, setActiveSector] = useState<SectorKey>('financial_services');

  const sectorWeights = weights[activeSector] || {};
  const total         = Object.values(sectorWeights).reduce((a, b) => a + b, 0);
  const totalRounded  = Math.round(total * 100) / 100;
  const sumOk         = Math.abs(totalRounded - 1.0) < 0.005;

  return (
    <div className="space-y-4">
      {/* Sector selector */}
      <div className="flex flex-wrap gap-2">
        {SECTORS.map(({ key, label }) => (
          <TabButton
            key={key}
            active={activeSector === key}
            onClick={() => setActiveSector(key)}
          >
            {label}
          </TabButton>
        ))}
      </div>

      {/* Weights table */}
      <div className="card overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {SECTORS.find(s => s.key === activeSector)?.label} KPI Weights
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: sumOk ? 'rgba(0,166,81,0.1)' : 'rgba(208,2,27,0.1)',
              color:      sumOk ? '#00A651' : '#D0021B',
            }}
          >
            {sumOk ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
            Sum: {totalRounded.toFixed(3)} {sumOk ? '✓' : '(must be 1.000)'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                <th className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)', width: '45%' }}>KPI</th>
                <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Weight</th>
                <th className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)', width: '35%' }}>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sectorWeights).map(([kpiId, w], i, arr) => (
                <tr
                  key={kpiId}
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {kpiLabel(kpiId)}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={w}
                      onChange={e => onChange(activeSector, kpiId, Number(e.target.value))}
                      className="w-24 rounded-lg px-2.5 py-1.5 text-xs text-right"
                      style={{
                        background: 'var(--bg)',
                        border:     '1px solid var(--border)',
                        color:      'var(--text-primary)',
                        outline:    'none',
                      }}
                    />
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      ({(w * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg)', width: '100%' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width:      `${Math.min((w / 0.15) * 100, 100)}%`,
                          background: 'var(--sanlam-teal)',
                          opacity:    0.7,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        <Info size={11} className="inline mr-1" />
        Weights must sum to exactly 1.000 per sector. Adjust values and check the sum indicator before saving.
      </p>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  if (!history.length) {
    return (
      <div className="card p-10 text-center" style={{ background: 'var(--surface)' }}>
        <History size={24} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No changes recorded yet. All edits will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden" style={{ background: 'var(--surface)' }}>
      {history.map((entry, i) => {
        const daysAgo = Math.floor((Date.now() - new Date(entry.changedAt).getTime()) / 86400000);
        const label   = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

        return (
          <div
            key={i}
            className="flex items-start gap-3 px-5 py-4"
            style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(0,181,237,0.08)' }}
            >
              <History size={13} style={{ color: 'var(--sanlam-teal)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {entry.reason}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {entry.changedBy}
              </p>
            </div>
            <p className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ActiveTab = 'thresholds' | 'weights' | 'history';

export default function ScoringConfigPage() {
  const [config,   setConfig]   = useState<ScoringConfig | null>(null);
  const [edited,   setEdited]   = useState<ScoringConfig | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);
  const [reason,   setReason]   = useState('');
  const [tab,      setTab]      = useState<ActiveTab>('thresholds');
  const [resetStep, setResetStep] = useState(0); // 0 = idle, 1 = confirm

  const isDirty = config !== null && edited !== null && (
    JSON.stringify(edited.sectorWeights) !== JSON.stringify(config.sectorWeights) ||
    JSON.stringify(edited.kpiThresholds) !== JSON.stringify(config.kpiThresholds)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/scoring-config');
      if (!res) throw new Error('Not authenticated');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setConfig(json);
      setEdited(JSON.parse(JSON.stringify(json)));
    } catch (err: any) {
      setError(err.message || 'Failed to load scoring config.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!edited || !reason.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch('/api/scoring-config', {
        method: 'PUT',
        body:   JSON.stringify({
          sectorWeights: edited.sectorWeights,
          kpiThresholds: edited.kpiThresholds,
          reason:        reason.trim(),
        }),
      });
      if (!res) throw new Error('Not authenticated');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSuccess('Scoring configuration saved successfully.');
      setReason('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (resetStep === 0) { setResetStep(1); return; }
    if (!reason.trim()) { setError('Enter a change reason before resetting.'); return; }
    setSaving(true);
    setError(null);
    setSuccess(null);
    setResetStep(0);
    try {
      const res = await apiFetch('/api/scoring-config', {
        method: 'DELETE',
        body:   JSON.stringify({ reason: reason.trim() }),
      });
      if (!res) throw new Error('Not authenticated');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSuccess('Configuration reset to platform defaults.');
      setReason('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  const handleThresholdChange = (kpiId: string, field: 'low' | 'high', value: number) => {
    setEdited(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        kpiThresholds: {
          ...prev.kpiThresholds,
          [kpiId]: { ...prev.kpiThresholds[kpiId], [field]: value },
        },
      };
    });
  };

  const handleWeightChange = (sector: string, kpiId: string, value: number) => {
    setEdited(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sectorWeights: {
          ...prev.sectorWeights,
          [sector]: { ...prev.sectorWeights[sector], [kpiId]: value },
        },
      };
    });
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonCard className="h-12" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-40" />
      </div>
    );
  }

  if (error && !edited) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 text-center" style={{ background: 'var(--surface)' }}>
          <AlertTriangle size={24} className="mx-auto mb-3" style={{ color: '#D0021B' }} />
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      {/* Context bar */}
      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {config?.isDefault ? 'Using platform defaults - no custom config saved' : `Last updated by ${config?.updatedBy}`}
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        {config?.isDefault ? (
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E8A020' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8A020' }} />
            Hardcoded defaults active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#00A651' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00A651' }} />
            Custom config active
          </span>
        )}
      </PageContext>

      {/* Toast messages */}
      {success && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-card-in"
          style={{ background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.2)' }}
        >
          <CheckCircle size={15} style={{ color: '#00A651', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#00A651' }}>{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
            style={{ color: '#00A651' }}
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-card-in"
          style={{ background: 'rgba(208,2,27,0.06)', border: '1px solid rgba(208,2,27,0.15)' }}
        >
          <AlertTriangle size={15} style={{ color: '#D0021B', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#D0021B' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
            style={{ color: '#D0021B' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-2">
        <TabButton active={tab === 'thresholds'} onClick={() => setTab('thresholds')}>
          KPI Thresholds
        </TabButton>
        <TabButton active={tab === 'weights'} onClick={() => setTab('weights')}>
          Sector Weights
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          Change History
          {(config?.history?.length ?? 0) > 0 && (
            <span
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
              style={{ background: tab === 'history' ? 'rgba(255,255,255,0.25)' : 'rgba(0,181,237,0.15)', color: tab === 'history' ? '#fff' : 'var(--sanlam-teal)' }}
            >
              {config!.history.length}
            </span>
          )}
        </TabButton>
      </div>

      {/* Tab content */}
      {tab === 'thresholds' && edited && (
        <ThresholdsTab
          thresholds={edited.kpiThresholds}
          onChange={handleThresholdChange}
        />
      )}
      {tab === 'weights' && edited && (
        <WeightsTab
          weights={edited.sectorWeights}
          onChange={handleWeightChange}
        />
      )}
      {tab === 'history' && config && (
        <HistoryTab history={config.history} />
      )}

      {/* Save footer - hidden on history tab */}
      {tab !== 'history' && (
        <div
          className="card p-5 space-y-4 animate-card-in"
          style={{ background: 'var(--surface)', position: 'sticky', bottom: 16 }}
        >
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Change reason <span style={{ color: '#D0021B' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Describe why these scoring parameters are being changed…"
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{
                background:  'var(--bg)',
                border:      `1px solid ${reason.trim() ? 'var(--sanlam-teal)' : 'var(--border)'}`,
                color:       'var(--text-primary)',
                outline:     'none',
                transition:  'border-color 200ms',
              }}
            />
          </div>

          <div className="flex items-center gap-3 justify-end">
            {/* Reset button - two step */}
            {resetStep === 0 ? (
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium pressable transition-all duration-150"
                style={{
                  background: 'var(--bg)',
                  border:     '1px solid var(--border)',
                  color:      'var(--text-muted)',
                  opacity:    saving ? 0.5 : 1,
                }}
              >
                <RotateCcw size={14} />
                Reset to Defaults
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#D0021B' }}>
                  This will erase all custom config. Are you sure?
                </span>
                <button
                  onClick={() => setResetStep(0)}
                  className="px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving || !reason.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold pressable"
                  style={{
                    background: '#D0021B',
                    color:      '#fff',
                    opacity:    saving || !reason.trim() ? 0.5 : 1,
                  }}
                >
                  <RotateCcw size={12} />
                  Confirm Reset
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !reason.trim() || !isDirty}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold pressable transition-all duration-150"
              style={{
                background: 'var(--sanlam-teal)',
                color:      '#fff',
                opacity:    saving || !reason.trim() || !isDirty ? 0.5 : 1,
                cursor:     saving || !reason.trim() || !isDirty ? 'not-allowed' : 'pointer',
              }}
            >
              {saving
                ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Save size={15} />}
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
