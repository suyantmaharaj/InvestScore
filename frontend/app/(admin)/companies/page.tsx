'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import {
  Search, Plus, Building2, Edit2,
  CheckCircle, XCircle,
} from 'lucide-react';

interface Company {
  id:               string;
  name:             string;
  sector:           string;
  mandate:          string;
  bbbeeLevel?:      number;
  assignedPmEmail?: string;
  active:           boolean;
  targetIrr?:       number;
  location?:        string;
  createdAt:        string;
}

const MANDATE_COLOR: Record<string, string> = {
  Growth:      '#00B5ED',
  Empowerment: '#00A651',
  Development: '#E8A020',
};

const SECTOR_LABELS: Record<string, string> = {
  financial_services: 'Financial Services',
  manufacturing:      'Manufacturing',
  ict:                'ICT',
  housing:            'Housing',
  infrastructure:     'Infrastructure',
  retail:             'Retail',
  logistics:          'Logistics',
  other:              'Other',
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

export default function CompaniesPage() {
  const router = useRouter();
  const [companies,     setCompanies]     = useState<Company[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterMandate, setFilterMandate] = useState('all');
  const [filterActive,  setFilterActive]  = useState<'all' | 'active' | 'inactive'>('active');
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await apiFetch('/api/company-management');
        if (!res) return;
        const json = await res.json();
        setCompanies(json.companies || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleActive = async (company: Company) => {
    setTogglingId(company.id);
    try {
      const res = await apiFetch(`/api/company-management/${company.id}/deactivate`, {
        method: 'PATCH',
      });
      if (!res) return;
      const json = await res.json();
      setCompanies(prev => prev.map(c =>
        c.id === company.id ? { ...c, active: json.active } : c
      ));
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = companies.filter(c => {
    const matchSearch  = !search
      || c.name.toLowerCase().includes(search.toLowerCase())
      || c.sector.includes(search.toLowerCase())
      || c.location?.toLowerCase().includes(search.toLowerCase());
    const matchMandate = filterMandate === 'all' || c.mandate === filterMandate;
    const matchActive  =
      filterActive === 'all'      ? true :
      filterActive === 'active'   ? c.active !== false :
      c.active === false;
    return matchSearch && matchMandate && matchActive;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <SkeletonCard className="h-12" />
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {companies.filter(c => c.active !== false).length} active ·{' '}
          {companies.filter(c => c.active === false).length} inactive
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <button
          onClick={() => router.push('/companies/new')}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition pressable"
          style={{ background: 'var(--sanlam-teal)' }}
        >
          <Plus size={12} /> Add company
        </button>
      </PageContext>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {['all', 'Growth', 'Empowerment', 'Development'].map(m => (
          <button
            key={m}
            onClick={() => setFilterMandate(m)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition pressable"
            style={{
              background: filterMandate === m
                ? m === 'all' ? 'rgba(0,181,237,0.1)' : `${MANDATE_COLOR[m]}15`
                : 'var(--surface)',
              color: filterMandate === m
                ? m === 'all' ? 'var(--sanlam-teal)' : MANDATE_COLOR[m]
                : 'var(--text-muted)',
              border: `1px solid ${filterMandate === m
                ? m === 'all' ? 'rgba(0,181,237,0.2)' : `${MANDATE_COLOR[m]}30`
                : 'var(--border)'}`,
            }}
          >
            {m === 'all' ? 'All mandates' : m}
          </button>
        ))}

        {(['all', 'active', 'inactive'] as const).map(a => (
          <button
            key={a}
            onClick={() => setFilterActive(a)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition pressable"
            style={{
              background: filterActive === a ? 'rgba(0,181,237,0.1)' : 'var(--surface)',
              color:      filterActive === a ? 'var(--sanlam-teal)'   : 'var(--text-muted)',
              border:     `1px solid ${filterActive === a ? 'rgba(0,181,237,0.2)' : 'var(--border)'}`,
            }}
          >
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </button>
        ))}
      </div>

      {/* Company table */}
      <div className="card" style={{ background: 'var(--surface)' }}>
        <div
          className="grid px-5 py-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px',
            color:               'var(--text-muted)',
            borderBottom:        '1px solid var(--border)',
            background:          'var(--bg)',
          }}
        >
          <span>Company</span>
          <span>Sector</span>
          <span>Mandate</span>
          <span>PM</span>
          <span className="text-center">B-BBEE</span>
          <span className="text-center">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Building2 size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No companies match your search.' : 'No companies yet.'}
            </p>
          </div>
        ) : (
          filtered.map((company, idx) => (
            <div
              key={company.id}
              className="grid px-5 py-3.5 items-center animate-card-in"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                opacity:      company.active === false ? 0.5 : 1,
                animationDelay: `${idx * 25}ms`,
              }}
            >
              {/* Company name + location */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: company.active === false
                      ? 'var(--border)'
                      : MANDATE_COLOR[company.mandate] || 'var(--sanlam-navy)',
                  }}
                >
                  {company.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {company.name}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {company.location || '—'}
                    {company.active === false && (
                      <span className="ml-1.5 text-[10px] font-semibold" style={{ color: '#D0021B' }}>
                        Inactive
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Sector */}
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {SECTOR_LABELS[company.sector] || company.sector}
              </p>

              {/* Mandate */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                style={{
                  background: `${MANDATE_COLOR[company.mandate] || '#4A5568'}15`,
                  color:       MANDATE_COLOR[company.mandate] || '#4A5568',
                }}
              >
                {company.mandate}
              </span>

              {/* PM */}
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {company.assignedPmEmail
                  ? company.assignedPmEmail.split('@')[0]
                  : <span style={{ color: 'var(--border)' }}>Unassigned</span>}
              </p>

              {/* B-BBEE */}
              <p
                className="text-xs text-center font-semibold"
                style={{
                  color: company.bbbeeLevel
                    ? company.bbbeeLevel <= 2 ? '#B8860B'
                    : company.bbbeeLevel <= 4 ? '#00A651'
                    : 'var(--text-muted)'
                    : 'var(--text-muted)',
                }}
              >
                {company.bbbeeLevel ? `L${company.bbbeeLevel}` : '—'}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => router.push(`/companies/${company.id}`)}
                  className="p-1.5 rounded-lg transition pressable"
                  style={{ color: 'var(--sanlam-teal)' }}
                  title="Edit company"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,181,237,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleToggleActive(company)}
                  disabled={togglingId === company.id}
                  className="p-1.5 rounded-lg transition pressable disabled:opacity-50"
                  style={{ color: company.active === false ? '#00A651' : '#D0021B' }}
                  title={company.active === false ? 'Reactivate' : 'Deactivate'}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {company.active === false
                    ? <CheckCircle size={14} />
                    : <XCircle    size={14} />
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
