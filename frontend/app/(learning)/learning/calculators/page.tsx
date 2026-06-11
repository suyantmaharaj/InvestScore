'use client';

import { useState } from 'react';

// ─── Scope 2 Emissions Calculator ─────────────────────────────────────────────

function Scope2Calculator() {
  const [kwhGrid,    setKwhGrid]    = useState('');
  const [kwhRenew,   setKwhRenew]   = useState('');
  const [factor,     setFactor]     = useState('0.9');
  const [result,     setResult]     = useState<{ scope2: number; renewable_pct: number } | null>(null);

  const calc = () => {
    const grid  = parseFloat(kwhGrid)  || 0;
    const renew = parseFloat(kwhRenew) || 0;
    const ef    = parseFloat(factor)   || 0.9;
    const scope2 = grid * ef;
    const total  = grid + renew;
    const renewable_pct = total > 0 ? (renew / total) * 100 : 0;
    setResult({ scope2, renewable_pct });
  };

  return (
    <div className="card p-6" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">⚡</span>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Scope 2 Emissions Calculator
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>SDG 7 · SDG 13</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Grid electricity used (kWh/year)
          </label>
          <input
            type="number"
            value={kwhGrid}
            onChange={e => setKwhGrid(e.target.value)}
            placeholder="e.g. 120 000"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Renewable energy used (kWh/year)
          </label>
          <input
            type="number"
            value={kwhRenew}
            onChange={e => setKwhRenew(e.target.value)}
            placeholder="e.g. 30 000"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            SA grid emission factor (kg CO₂e/kWh)
          </label>
          <select
            value={factor}
            onChange={e => setFactor(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="0.9">0.90 - South Africa Eskom grid (default)</option>
            <option value="0.8">0.80 - Partial renewable grid mix</option>
            <option value="0.5">0.50 - Mixed renewable/fossil grid</option>
            <option value="0.2">0.20 - Predominantly renewable grid</option>
          </select>
        </div>
      </div>

      <button
        onClick={calc}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
        style={{ background: 'var(--sanlam-teal)' }}
      >
        Calculate
      </button>

      {result && (
        <div
          className="mt-5 rounded-xl p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <ResultRow
            label="Scope 2 emissions"
            value={result.scope2.toFixed(0)}
            unit="kg CO₂e/year"
            color={result.scope2 > 100000 ? '#D0021B' : result.scope2 > 50000 ? '#E8A020' : '#00A651'}
          />
          <ResultRow
            label="Renewable energy share"
            value={result.renewable_pct.toFixed(1)}
            unit="%"
            color={result.renewable_pct >= 30 ? '#00A651' : result.renewable_pct >= 10 ? '#E8A020' : '#D0021B'}
          />
          <p className="text-[11px] pt-1" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
            Based on GHG Protocol Scope 2 location-based method. Enter Scope 2 value in your SDG submission for SDG 7 and SDG 13 scoring.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Recycling Rate Calculator ─────────────────────────────────────────────────

function RecyclingCalculator() {
  const [totalWaste,    setTotalWaste]    = useState('');
  const [recycled,      setRecycled]      = useState('');
  const [result,        setResult]        = useState<{ rate: number; landfill: number } | null>(null);

  const calc = () => {
    const total = parseFloat(totalWaste) || 0;
    const rec   = parseFloat(recycled)   || 0;
    if (total <= 0) return;
    const rate    = (rec / total) * 100;
    const landfill = total - rec;
    setResult({ rate, landfill });
  };

  return (
    <div className="card p-6" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">♻️</span>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Recycling Rate Calculator
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>SDG 12 · SDG 15</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Total waste generated (tonnes/year)
          </label>
          <input
            type="number"
            value={totalWaste}
            onChange={e => setTotalWaste(e.target.value)}
            placeholder="e.g. 50"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Waste recycled or composted (tonnes/year)
          </label>
          <input
            type="number"
            value={recycled}
            onChange={e => setRecycled(e.target.value)}
            placeholder="e.g. 20"
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      <button
        onClick={calc}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
        style={{ background: 'var(--sanlam-teal)' }}
      >
        Calculate
      </button>

      {result && (
        <div
          className="mt-5 rounded-xl p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <ResultRow
            label="Recycling rate"
            value={result.rate.toFixed(1)}
            unit="%"
            color={result.rate >= 50 ? '#00A651' : result.rate >= 20 ? '#E8A020' : '#D0021B'}
          />
          <ResultRow
            label="Landfill waste"
            value={result.landfill.toFixed(1)}
            unit="tonnes/year"
            color={result.landfill > 30 ? '#D0021B' : result.landfill > 10 ? '#E8A020' : '#00A651'}
          />
          <div className="pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              className="flex items-center gap-2 p-2 rounded-lg text-[11px] font-medium"
              style={{
                background: result.rate >= 50 ? 'rgba(0,166,81,0.07)' : result.rate >= 20 ? 'rgba(232,160,32,0.08)' : 'rgba(208,2,27,0.06)',
                color: result.rate >= 50 ? '#00A651' : result.rate >= 20 ? '#E8A020' : '#D0021B',
              }}
            >
              {result.rate >= 50
                ? '✓ High recycling rate - SDG 12 & 15 will likely score High Impact'
                : result.rate >= 20
                ? '⚠ Moderate rate - targeting 50%+ improves SDG 12 & 15 scores significantly'
                : '✗ Low rate - major improvement opportunity for SDG 12 & 15'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── B-BBEE Scorecard Calculator ─────────────────────────────────────────────

function BBBEECalculator() {
  const [ownership,    setOwnership]    = useState('');
  const [management,  setManagement]   = useState('');
  const [skills,       setSkills]       = useState('');
  const [enterprise,  setEnterprise]   = useState('');
  const [socio,        setSocio]        = useState('');
  const [result,       setResult]       = useState<{ total: number; level: number } | null>(null);

  const maxPoints: Record<string, number> = {
    ownership:   25,
    management:  19,
    skills:      20,
    enterprise:  40,
    socio:       5,
  };

  const calc = () => {
    const o = Math.min(parseFloat(ownership)   || 0, 25);
    const m = Math.min(parseFloat(management)  || 0, 19);
    const s = Math.min(parseFloat(skills)      || 0, 20);
    const e = Math.min(parseFloat(enterprise)  || 0, 40);
    const sc = Math.min(parseFloat(socio)      || 0, 5);
    const total = o + m + s + e + sc;
    let level = 8;
    if (total >= 100) level = 1;
    else if (total >= 95) level = 2;
    else if (total >= 90) level = 3;
    else if (total >= 80) level = 4;
    else if (total >= 75) level = 5;
    else if (total >= 70) level = 6;
    else if (total >= 55) level = 7;
    setResult({ total, level });
  };

  return (
    <div className="card p-6" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">🏅</span>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            B-BBEE Score Estimator
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>SDG 10 · SDG 16</p>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        Enter your estimated points per pillar (based on the generic scorecard). Use your certified B-BBEE score for formal submissions.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Ownership',               max: 25,  val: ownership,   set: setOwnership },
          { label: 'Management Control',      max: 19,  val: management,  set: setManagement },
          { label: 'Skills Development',      max: 20,  val: skills,      set: setSkills },
          { label: 'Enterprise & Supplier Dev', max: 40, val: enterprise, set: setEnterprise },
          { label: 'Socio-Economic Dev',       max: 5,  val: socio,       set: setSocio },
        ].map(({ label, max, val, set }) => (
          <div key={label}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              {label} <span style={{ opacity: 0.6 }}>(max {max})</span>
            </label>
            <input
              type="number"
              min={0}
              max={max}
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={`0 – ${max}`}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        ))}
      </div>

      <button
        onClick={calc}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition"
        style={{ background: 'var(--sanlam-teal)' }}
      >
        Estimate level
      </button>

      {result && (
        <div
          className="mt-5 rounded-xl p-4 space-y-3 animate-fade-in"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <ResultRow
            label="Total B-BBEE points"
            value={result.total.toFixed(1)}
            unit="/ 109"
            color={result.total >= 90 ? '#00A651' : result.total >= 70 ? '#E8A020' : '#D0021B'}
          />
          <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Estimated B-BBEE level</span>
            <div
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                background: result.level <= 3 ? 'rgba(0,166,81,0.1)' : result.level <= 6 ? 'rgba(232,160,32,0.1)' : 'rgba(208,2,27,0.1)',
                color: result.level <= 3 ? '#00A651' : result.level <= 6 ? '#E8A020' : '#D0021B',
              }}
            >
              Level {result.level}
            </div>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Enter this level as your B-BBEE rating in your SDG submission. Levels 1–4 achieve High Impact for SDG 10 and SDG 16.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Shared result row ─────────────────────────────────────────────────────────

function ResultRow({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {value} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CalculatorsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-in">

      <div>
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Practice Calculators
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Use these tools to calculate the KPI values you need before filling in your submission.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Scope2Calculator />
        <RecyclingCalculator />
      </div>
      <BBBEECalculator />

    </div>
  );
}
