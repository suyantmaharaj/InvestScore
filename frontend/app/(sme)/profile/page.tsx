'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Save, CheckCircle, Upload, Trash2, ExternalLink,
  Shield, Clock, XCircle, AlertTriangle,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSMEData } from '@/hooks/useSMEData';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import { uploadCompanyDocument, formatFileSize, getFileIcon } from '@/lib/storage-upload';

const SECTORS = [
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'manufacturing',      label: 'Manufacturing' },
  { value: 'ict',                label: 'ICT' },
  { value: 'housing',            label: 'Housing' },
  { value: 'infrastructure',     label: 'Infrastructure' },
  { value: 'retail',             label: 'Retail' },
  { value: 'logistics',          label: 'Logistics' },
  { value: 'other',              label: 'Other' },
];

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

export default function CompanyProfilePage() {
  const { user }             = useAuth();
  const { company, loading } = useSMEData();

  // Company info state
  const [name,              setName]              = useState('');
  const [industry,          setIndustry]          = useState('');
  const [sector,            setSector]            = useState('');
  const [location,          setLocation]          = useState('');
  const [description,       setDescription]       = useState('');
  const [website,           setWebsite]           = useState('');
  const [spokespersonName,  setSpokespersonName]  = useState('');
  const [spokespersonTitle, setSpokespersonTitle] = useState('');
  const [spokespersonEmail, setSpokespersonEmail] = useState('');
  const [saved,             setSaved]             = useState(false);
  const [saving,            setSaving]            = useState(false);

  // Document vault state
  const [documents,      setDocuments]      = useState<any[]>([]);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docDescription, setDocDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // B-BBEE state
  const [bbbeeVerifs,    setBbbeeVerifs]    = useState<any[]>([]);
  const [bbbeeUploading, setBbbeeUploading] = useState(false);
  const [bbbeeProgress,  setBbbeeProgress]  = useState(0);
  const [claimedLevel,   setClaimedLevel]   = useState(1);
  const bbbeeInputRef = useRef<HTMLInputElement>(null);

  const totalStorageUsed  = documents.reduce((s, d) => s + (d.fileSize || 0), 0);
  const storageUsedMB     = (totalStorageUsed / 1024 / 1024).toFixed(1);
  const storageCapacityMB = 50;

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

  useEffect(() => {
    if (!user?.companyId) return;

    const loadDocs = async () => {
      try {
        const [docsRes, bbRes] = await Promise.all([
          apiFetch(`/api/documents/${user.companyId}`),
          apiFetch(`/api/documents/${user.companyId}/bbbee`),
        ]);
        const [docsJson, bbJson] = await Promise.all([docsRes.json(), bbRes.json()]);
        setDocuments(docsJson.documents || []);
        setBbbeeVerifs(bbJson.verifications || []);
      } catch (err) {
        console.error('Load documents error:', err);
      }
    };

    loadDocs();
  }, [user?.companyId]);

  const handleSave = async () => {
    if (!user?.companyId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'companies', user.companyId), {
        name, industry, sector, location, description, website,
        spokespersonName, spokespersonTitle, spokespersonEmail,
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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.companyId) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadCompanyDocument(user.companyId, file, 'documents', p => setUploadProgress(p));
      const res    = await apiFetch(`/api/documents/${user.companyId}`, {
        method: 'POST',
        body:   JSON.stringify({ ...result, description: docDescription }),
      });
      const json = await res.json();
      if (json.document) setDocuments(prev => [json.document, ...prev]);
      setDocDescription('');
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBbbeeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.companyId) return;
    setBbbeeUploading(true);
    setBbbeeProgress(0);
    try {
      const result = await uploadCompanyDocument(user.companyId, file, 'bbbee', p => setBbbeeProgress(p));
      const res    = await apiFetch(`/api/documents/${user.companyId}/bbbee`, {
        method: 'POST',
        body:   JSON.stringify({ ...result, claimedLevel }),
      });
      const json = await res.json();
      if (json.verification) setBbbeeVerifs(prev => [json.verification, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setBbbeeUploading(false);
      setBbbeeProgress(0);
      if (bbbeeInputRef.current) bbbeeInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!user?.companyId) return;
    try {
      await apiFetch(`/api/documents/${user.companyId}/${docId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Delete error:', err);
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
  const inputStyle = { background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' };
  const labelClass = 'block text-xs font-medium mb-1.5';
  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">
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
              No company linked — contact your Portfolio Manager
            </span>
          </>
        )}
      </PageContext>

      {/* Company Information */}
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

      {/* Spokesperson */}
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

      {/* B-BBEE Certificate */}
      {user?.companyId && (
        <div className="card p-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} style={{ color: 'var(--sanlam-teal)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              B-BBEE Certificate
            </p>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Upload your current B-BBEE certificate. Sanlam Investments will verify it before
            reflecting the level on your scorecard. Only upload SANAS-accredited certificates.
          </p>

          {/* Current verification status */}
          {bbbeeVerifs.length > 0 && (() => {
            const latest = bbbeeVerifs[0];
            const statusConfig = {
              pending:    { color: '#E8A020', Icon: Clock,         label: 'Awaiting verification' },
              approved:   { color: '#00A651', Icon: CheckCircle,   label: 'Verified'              },
              rejected:   { color: '#D0021B', Icon: XCircle,       label: 'Rejected'              },
              superseded: { color: '#4A5568', Icon: AlertTriangle, label: 'Superseded'            },
            };
            const cfg = statusConfig[latest.status as keyof typeof statusConfig] || statusConfig.pending;
            const { Icon } = cfg;

            return (
              <div
                className="rounded-xl p-4 mb-5 flex items-start gap-3"
                style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}25` }}
              >
                <Icon size={16} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: cfg.color }}>
                      Level {latest.claimedLevel} — {cfg.label}
                    </p>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {latest.originalName}
                    </span>
                  </div>
                  {latest.status === 'rejected' && latest.rejectionReason && (
                    <p className="text-xs mt-1" style={{ color: '#D0021B' }}>
                      Reason: {latest.rejectionReason}
                    </p>
                  )}
                  {latest.status === 'approved' && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Verified by {latest.reviewedBy?.split('@')[0]} on{' '}
                      {new Date(latest.reviewedAt).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  )}
                  <a
                    href={latest.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium mt-1.5 hover:underline"
                    style={{ color: 'var(--sanlam-teal)' }}
                  >
                    <ExternalLink size={11} /> View certificate
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Level selector + upload */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                B-BBEE Level claimed
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(level => {
                  const active = claimedLevel === level;
                  const color  = level <= 2 ? '#B8860B' : level <= 4 ? '#00A651' : 'var(--sanlam-teal)';
                  const bg     = level <= 2 ? 'rgba(212,175,55,0.2)' : level <= 4 ? 'rgba(0,166,81,0.1)' : 'rgba(0,181,237,0.1)';
                  const border = level <= 2 ? 'rgba(212,175,55,0.4)' : level <= 4 ? 'rgba(0,166,81,0.3)' : 'rgba(0,181,237,0.3)';
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setClaimedLevel(level)}
                      className="w-9 h-9 rounded-xl text-sm font-bold transition-all pressable"
                      style={{
                        background: active ? bg             : 'var(--bg)',
                        color:      active ? color          : 'var(--text-muted)',
                        border:     `1.5px solid ${active ? border : 'var(--border)'}`,
                      }}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                {claimedLevel <= 2
                  ? 'Excellent transformation — top B-BBEE rating'
                  : claimedLevel <= 4
                  ? 'Good — compliant and transformation-positive'
                  : claimedLevel <= 6
                  ? 'Compliant — consider an improvement plan'
                  : 'Below target — B-BBEE improvement needed'}
              </p>
            </div>

            <input
              ref={bbbeeInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleBbbeeUpload}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => bbbeeInputRef.current?.click()}
              disabled={bbbeeUploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition pressable disabled:opacity-50"
              style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)', border: '1px solid rgba(0,181,237,0.2)' }}
            >
              <Upload size={15} />
              {bbbeeUploading ? 'Uploading...' : 'Upload certificate (PDF or image)'}
            </button>

            {bbbeeUploading && (
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>Uploading...</span><span>{bbbeeProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${bbbeeProgress}%`, background: 'var(--sanlam-teal)' }} />
                </div>
              </div>
            )}

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              PDF, JPG, or PNG · Max 10MB · Must be from a SANAS-accredited verification agency
            </p>
          </div>
        </div>
      )}

      {/* Document Vault */}
      {user?.companyId && (
        <div className="card p-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Company Documents
            </p>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {storageUsedMB} MB of {storageCapacityMB} MB used
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Upload supporting documents visible to your Portfolio Manager — annual reports,
            sustainability letters, financial statements, site photos, or any other context.
          </p>

          {/* Storage bar */}
          <div className="mb-4">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.min((parseFloat(storageUsedMB) / storageCapacityMB) * 100, 100)}%`,
                  background: parseFloat(storageUsedMB) > 40 ? '#E8A020' : 'var(--sanlam-teal)',
                }}
              />
            </div>
          </div>

          {/* Upload area */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Document description (optional)
              </label>
              <input
                type="text"
                value={docDescription}
                onChange={e => setDocDescription(e.target.value)}
                placeholder="e.g. Annual financial statements FY2024"
                className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png"
              onChange={handleDocumentUpload}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || parseFloat(storageUsedMB) >= storageCapacityMB}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition pressable disabled:opacity-50"
              style={{ background: 'var(--bg)', border: '1.5px dashed var(--border)', color: 'var(--text-muted)' }}
            >
              <Upload size={15} />
              {uploading ? `Uploading... ${uploadProgress}%` : 'Choose file to upload'}
            </button>

            {uploading && (
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: 'var(--sanlam-teal)' }} />
              </div>
            )}

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              PDF, Word, Excel, PowerPoint, JPG, PNG · Max 10MB per file
            </p>
          </div>

          {/* Document list */}
          {documents.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No documents uploaded yet
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
                      {new Date(doc.uploadedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg transition"
                      style={{ color: 'var(--sanlam-teal)' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 rounded-lg transition pressable"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#D0021B')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium animate-fade-in" style={{ color: '#00A651' }}>
            <CheckCircle size={15} /> Saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !user?.companyId}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 pressable"
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
