'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import PageContext from '@/components/shared/PageContext';
import { SkeletonCard } from '@/components/shared/Skeleton';

const SECTORS = [
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'manufacturing',      label: 'Manufacturing'      },
  { value: 'ict',                label: 'ICT'                },
  { value: 'housing',            label: 'Housing'            },
  { value: 'infrastructure',     label: 'Infrastructure'     },
  { value: 'retail',             label: 'Retail'             },
  { value: 'logistics',          label: 'Logistics'          },
  { value: 'other',              label: 'Other'              },
];

const MANDATES = ['Growth', 'Empowerment', 'Development'];

const MANDATE_DESCRIPTIONS: Record<string, string> = {
  Growth:      'R50m–R200m revenue · Any B-BBEE level · High employment potential',
  Empowerment: 'Up to R50m revenue · 51%+ Black ownership required · B-BBEE compliant',
  Development: 'Below R1m revenue · Black or women-owned · Early-stage micro-enterprise',
};

const MANDATE_COLORS: Record<string, string> = {
  Growth:      '#00B5ED',
  Empowerment: '#00A651',
  Development: '#E8A020',
};

async function apiFetch(path: string, options?: RequestInit) {
  const { auth } = await import('@/lib/firebase');
  const token    = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...options?.headers,
    },
  });
}

export default function CompanyFormPage() {
  const params = useParams();
  const router = useRouter();
  const isNew  = params.id === 'new';

  const [name,              setName]              = useState('');
  const [sector,            setSector]            = useState('financial_services');
  const [industry,          setIndustry]          = useState('');
  const [location,          setLocation]          = useState('');
  const [mandate,           setMandate]           = useState('Growth');
  const [bbbeeLevel,        setBbbeeLevel]        = useState<number | ''>('');
  const [description,       setDescription]       = useState('');
  const [website,           setWebsite]           = useState('');
  const [spokespersonName,  setSpokespersonName]  = useState('');
  const [spokespersonTitle, setSpokespersonTitle] = useState('');
  const [spokespersonEmail, setSpokespersonEmail] = useState('');
  const [assignedPmUid,     setAssignedPmUid]     = useState('');
  const [assignedPmEmail,   setAssignedPmEmail]   = useState('');
  const [targetIrr,         setTargetIrr]         = useState<number | ''>('');

  const [pmUsers, setPmUsers] = useState<{ uid: string; email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/company-management/pm-users')
      .then(r => r?.json())
      .then(j => setPmUsers(j?.pmUsers || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const res  = await apiFetch('/api/company-management');
        if (!res) return;
        const json = await res.json();
        const company = json.companies?.find((c: any) => c.id === params.id);
        if (!company) { router.push('/companies'); return; }

        setName(company.name || '');
        setSector(company.sector || 'financial_services');
        setIndustry(company.industry || '');
        setLocation(company.location || '');
        setMandate(company.mandate || 'Growth');
        setBbbeeLevel(company.bbbeeLevel || '');
        setDescription(company.description || '');
        setWebsite(company.website || '');
        setSpokespersonName(company.spokespersonName || '');
        setSpokespersonTitle(company.spokespersonTitle || '');
        setSpokespersonEmail(company.spokespersonEmail || '');
        setAssignedPmUid(company.assignedPmUid || '');
        setAssignedPmEmail(company.assignedPmEmail || '');
        setTargetIrr(company.targetIrr || '');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isNew, params.id]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Company name is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      const body = {
        name, sector, industry, location, mandate,
        bbbeeLevel:       bbbeeLevel || null,
        description,      website,
        spokespersonName, spokespersonTitle, spokespersonEmail,
        assignedPmUid:  assignedPmUid  || null,
        assignedPmEmail: assignedPmEmail || null,
        targetIrr:      targetIrr || null,
        active:         true,
      };

      const res = await apiFetch(
        isNew ? '/api/company-management' : `/api/company-management/${params.id}`,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(body) }
      );
      if (!res) throw new Error('No response');
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setSaved(true);
      setTimeout(() => router.push('/companies'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto"><SkeletonCard className="h-96" /></div>;
  }

  const inputClass = 'w-full h-11 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sanlam-teal';
  const inputStyle = { background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' };
  const labelClass = 'block text-xs font-medium mb-1.5';
  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-page-in">

      <PageContext>
        <button
          onClick={() => router.push('/companies')}
          className="flex items-center gap-1.5 text-xs transition pressable"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={12} /> Back to companies
        </button>
      </PageContext>

      {/* Company details */}
      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          {isNew ? 'New Company' : 'Edit Company'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Company name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Khaya Capital" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Sector *</label>
            <select value={sector} onChange={e => setSector(e.target.value)} className={inputClass} style={inputStyle}>
              {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. SME Finance" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Johannesburg, Gauteng" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="https://company.co.za" type="url" className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} placeholder="What does this company do?"
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none"
              style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Investment details */}
      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          Investment Details
        </p>

        <div className="mb-4">
          <label className={labelClass} style={labelStyle}>Mandate *</label>
          <div className="grid grid-cols-3 gap-2">
            {MANDATES.map(m => {
              const color = MANDATE_COLORS[m];
              return (
                <button
                  key={m} type="button"
                  onClick={() => setMandate(m)}
                  className="p-3 rounded-xl text-left transition-all pressable"
                  style={{
                    background: mandate === m ? `${color}12` : 'var(--bg)',
                    border:     `1.5px solid ${mandate === m ? color + '40' : 'var(--border)'}`,
                  }}
                >
                  <p className="text-sm font-semibold mb-1"
                    style={{ color: mandate === m ? color : 'var(--text-muted)' }}>
                    {m}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {MANDATE_DESCRIPTIONS[m]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>B-BBEE Level</label>
            <select
              value={bbbeeLevel}
              onChange={e => setBbbeeLevel(e.target.value ? parseInt(e.target.value) : '')}
              className={inputClass} style={inputStyle}
            >
              <option value="">Not certified</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(l => (
                <option key={l} value={l}>
                  Level {l}{l <= 2 ? ' (Excellent)' : l <= 4 ? ' (Good)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Target IRR (%)</label>
            <input
              type="number" value={targetIrr}
              onChange={e => setTargetIrr(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={mandate === 'Growth' ? 'e.g. 20' : mandate === 'Empowerment' ? 'e.g. 15' : 'e.g. 11'}
              min="0" max="100" step="0.5"
              className={inputClass} style={inputStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {mandate === 'Growth' ? 'Typical: 15–25%' : mandate === 'Empowerment' ? 'Typical: 11–18%' : 'Typical: 8–14%'}
            </p>
          </div>
        </div>
      </div>

      {/* PM Assignment */}
      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          Portfolio Manager Assignment
        </p>
        <div>
          <label className={labelClass} style={labelStyle}>Assign to PM</label>
          <select
            value={assignedPmUid}
            onChange={e => {
              const selected = pmUsers.find(p => p.uid === e.target.value);
              setAssignedPmUid(e.target.value);
              setAssignedPmEmail(selected?.email || '');
            }}
            className={inputClass} style={inputStyle}
          >
            <option value="">Unassigned — visible to all PMs</option>
            {pmUsers.map(pm => (
              <option key={pm.uid} value={pm.uid}>
                {pm.name} ({pm.email})
              </option>
            ))}
          </select>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            If unassigned, this company is visible to all Portfolio Managers.
          </p>
        </div>
      </div>

      {/* Spokesperson */}
      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          Spokesperson / Key Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Full name</label>
            <input value={spokespersonName} onChange={e => setSpokespersonName(e.target.value)}
              placeholder="e.g. Sipho Nkosi" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Job title</label>
            <input value={spokespersonTitle} onChange={e => setSpokespersonTitle(e.target.value)}
              placeholder="e.g. CEO" className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Email</label>
            <input value={spokespersonEmail} onChange={e => setSpokespersonEmail(e.target.value)}
              type="email" placeholder="sipho@company.co.za"
              className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm px-1" style={{ color: '#D0021B' }}>{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 pb-6">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium animate-fade-in" style={{ color: '#00A651' }}>
            <CheckCircle size={15} />
            {isNew ? 'Company created' : 'Changes saved'}
          </span>
        )}
        <button
          onClick={() => router.push('/companies')}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition pressable"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 pressable"
          style={{ background: 'var(--sanlam-teal)' }}
        >
          <Save size={15} />
          {saving ? 'Saving...' : isNew ? 'Create company' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
