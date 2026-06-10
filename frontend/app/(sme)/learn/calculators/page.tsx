'use client';

import { useState } from 'react';
import PageContext from '@/components/shared/PageContext';

function CalcCard({ title, icon, children }: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 animate-card-in" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function InputRow({ label, value, onChange, unit, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none focus:ring-2"
          style={{
            background: 'var(--bg)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <span
          className="flex items-center px-3 rounded-xl text-xs font-medium flex-shrink-0"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color = 'var(--text-primary)' }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function CalculatorsPage() {
  const [kwh, setKwh] = useState('');
  const [totalWaste, setTotalWaste] = useState('');
  const [recycled, setRecycled] = useState('');
  const [totalEquity, setTotalEquity] = useState('');
  const [blackEquity, setBlackEquity] = useState('');
  const [blackFemale, setBlackFemale] = useState('');

  const scope2 = kwh ? (parseFloat(kwh) * 0.00093).toFixed(2) : null;
  const scope2Classification = scope2
    ? parseFloat(scope2) < 100 ? 'High' : parseFloat(scope2) < 500 ? 'Medium' : 'Low'
    : null;

  const recyclingRate = totalWaste && recycled
    ? ((parseFloat(recycled) / parseFloat(totalWaste)) * 100).toFixed(1)
    : null;
  const recyclingClassification = recyclingRate
    ? parseFloat(recyclingRate) >= 50 ? 'High' : parseFloat(recyclingRate) >= 10 ? 'Medium' : 'Low'
    : null;

  const blackOwnershipPct = totalEquity && blackEquity
    ? ((parseFloat(blackEquity) / parseFloat(totalEquity)) * 100).toFixed(1)
    : null;
  const blackFemPct = totalEquity && blackFemale
    ? ((parseFloat(blackFemale) / parseFloat(totalEquity)) * 100).toFixed(1)
    : null;
  const ownershipClassification = blackOwnershipPct
    ? parseFloat(blackOwnershipPct) >= 51 ? 'High' : parseFloat(blackOwnershipPct) >= 25 ? 'Medium' : 'Low'
    : null;

  const classColor = (c: string | null) =>
    c === 'High' ? '#00A651' : c === 'Medium' ? '#E8A020' : c === 'Low' ? '#D0021B' : 'var(--text-primary)';

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-page-in">
      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Practice your calculations before submitting data
        </span>
      </PageContext>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <CalcCard title="Scope 2 Emissions Calculator" icon="⚡">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Calculate your CO2e from electricity consumption using the South African grid emission factor.
          </p>
          <InputRow
            label="Annual electricity consumption"
            value={kwh}
            onChange={setKwh}
            unit="kWh"
            placeholder="e.g. 28000"
          />
          {scope2 && (
            <div className="mt-3">
              <ResultRow label="Scope 2 emissions" value={`${scope2} tCO2e`} color={classColor(scope2Classification)} />
              <ResultRow label="Classification" value={scope2Classification || '-'} color={classColor(scope2Classification)} />
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                Formula: {kwh} kWh x 0.00093 = {scope2} tCO2e
              </p>
            </div>
          )}
        </CalcCard>

        <CalcCard title="Recycling Rate Calculator" icon="♻️">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Calculate your recycling rate from total waste generated and recycled.
          </p>
          <InputRow label="Total waste generated" value={totalWaste} onChange={setTotalWaste} unit="kg" placeholder="e.g. 1000" />
          <InputRow label="Total waste recycled" value={recycled} onChange={setRecycled} unit="kg" placeholder="e.g. 350" />
          {recyclingRate && (
            <div className="mt-3">
              <ResultRow label="Recycling rate" value={`${recyclingRate}%`} color={classColor(recyclingClassification)} />
              <ResultRow label="Classification" value={recyclingClassification || '-'} color={classColor(recyclingClassification)} />
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                Formula: ({recycled} / {totalWaste}) x 100 = {recyclingRate}%
              </p>
            </div>
          )}
        </CalcCard>

        <CalcCard title="B-BBEE Ownership Calculator" icon="🏆">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Calculate your Black and Black female ownership percentages.
          </p>
          <InputRow label="Total equity" value={totalEquity} onChange={setTotalEquity} unit="ZAR" placeholder="e.g. 1000000" />
          <InputRow label="Black-owned equity" value={blackEquity} onChange={setBlackEquity} unit="ZAR" placeholder="e.g. 510000" />
          <InputRow label="Black female-owned equity" value={blackFemale} onChange={setBlackFemale} unit="ZAR" placeholder="e.g. 250000" />
          {blackOwnershipPct && (
            <div className="mt-3">
              <ResultRow label="Black ownership" value={`${blackOwnershipPct}%`} color={classColor(ownershipClassification)} />
              {blackFemPct && <ResultRow label="Black female ownership" value={`${blackFemPct}%`} color="#00B5ED" />}
              <ResultRow label="Classification" value={ownershipClassification || '-'} color={classColor(ownershipClassification)} />
              {parseFloat(blackOwnershipPct) >= 51 && (
                <p className="text-[11px] mt-2 font-medium" style={{ color: '#00A651' }}>
                  Qualifies for Level 1 B-BBEE consideration
                </p>
              )}
            </div>
          )}
        </CalcCard>
      </div>
    </div>
  );
}
