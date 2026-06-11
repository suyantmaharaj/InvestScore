'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Save, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSMEData } from '@/hooks/useSMEData';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';

const SECTORS = [
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'ict', label: 'ICT' },
  { value: 'housing', label: 'Housing' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'retail', label: 'Retail' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'other', label: 'Other' },
];

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { company, loading } = useSMEData();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [sector, setSector] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [spokespersonName, setSpokespersonName] = useState('');
  const [spokespersonTitle, setSpokespersonTitle] = useState('');
  const [spokespersonEmail, setSpokespersonEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    setName(company.name || '');
    setIndustry(company.industry || '');
    setSector(company.sector || '');
    setLocation(company.location || '');
    setDescription(company.description || '');
    setWebsite(company.website || '');
    setSpokespersonName(company.spokespersonName || '');
    setSpokespersonTitle(company.spokespersonTitle || '');
    setSpokespersonEmail(company.spokespersonEmail || '');
  }, [company]);

  const handleSave = async () => {
    if (!user?.companyId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', user.companyId), {
        name,
        industry,
        sector,
        location,
        description,
        website,
        spokespersonName,
        spokespersonTitle,
        spokespersonEmail,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save company profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  const inputClass = 'w-full h-11 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sanlam-teal';
  const inputStyle = {
    background: 'var(--bg)',
    border: '1.5px solid var(--border)',
    color: 'var(--text-primary)',
  };
  const labelClass = 'block text-xs font-medium mb-1.5';
  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-page-in">
      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Company ID: <strong style={{ color: 'var(--text-primary)' }}>
            {user?.companyId || 'Not assigned'}
          </strong>
        </span>
        {!user?.companyId && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-medium" style={{ color: '#E8A020' }}>
              No company linked - contact your Portfolio Manager
            </span>
          </>
        )}
      </PageContext>

      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Company Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Company name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. SME Finance" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">Select sector...</option>
              {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Johannesburg, Gauteng" className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Website</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.co.za" type="url" className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Company description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What does your company do?"
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="card p-6" style={{ background: 'var(--surface)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Spokesperson / Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Full name</label>
            <input value={spokespersonName} onChange={e => setSpokespersonName(e.target.value)} placeholder="e.g. Sipho Nkosi" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Job title</label>
            <input value={spokespersonTitle} onChange={e => setSpokespersonTitle(e.target.value)} placeholder="e.g. CEO" className={inputClass} style={inputStyle} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>Email address</label>
            <input value={spokespersonEmail} onChange={e => setSpokespersonEmail(e.target.value)} type="email" placeholder="sipho@company.co.za" className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium animate-fade-in" style={{ color: '#00A651' }}>
            <CheckCircle size={15} /> Saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !user?.companyId}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: 'var(--sanlam-teal)' }}
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            : <><Save size={15} /> Save changes</>
          }
        </button>
      </div>
    </div>
  );
}
