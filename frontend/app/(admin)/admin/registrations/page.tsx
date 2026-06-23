'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Building2, Trash2, Copy, KeyRound } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';
import { useAuth } from '@/hooks/useAuth';

interface Registration {
  id:          string;
  name:        string;
  email:       string;
  companyName: string;
  industry:    string;
  description: string;
  requestedAt: string;
  status:      'pending' | 'approved' | 'rejected';
}

interface Company {
  id:   string;
  name: string;
}

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

export default function RegistrationsPage() {
  const { user } = useAuth();
  const [registrations,   setRegistrations]   = useState<Registration[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [actionId,        setActionId]        = useState<string | null>(null);
  const [filter,          setFilter]          = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [approveId,       setApproveId]       = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companies,       setCompanies]       = useState<Company[]>([]);
  const [deleteId,        setDeleteId]        = useState<string | null>(null);
  const [tempPassword,    setTempPassword]    = useState<string | null>(null);
  const [copied,          setCopied]          = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res  = await apiFetch('/api/admin/registrations');
      const json = await res.json();
      setRegistrations(json.registrations || []);
    } catch (err) {
      console.error('Load registrations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadCompanies = async () => {
      try {
        const res  = await apiFetch('/api/company-management');
        if (!res?.ok) return;
        const json = await res.json();
        const list = (json.companies || [])
          .map((c: any) => ({ id: c.id, name: c.name as string }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setCompanies(list);
      } catch (err) {
        console.error('Load companies error:', err);
      }
    };
    loadCompanies();
  }, [user]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const res  = await apiFetch(`/api/admin/registrations/${id}/approve`, {
        method: 'POST',
        body:   JSON.stringify({ companyId: selectedCompany || null }),
      });
      if (res.ok) {
        const json = await res.json();
        setRegistrations(prev =>
          prev.map(r => r.id === id ? { ...r, status: 'approved' } : r)
        );
        setApproveId(null);
        setSelectedCompany('');
        if (json.temporaryPassword) setTempPassword(json.temporaryPassword);
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await apiFetch(`/api/admin/registrations/${id}/reject`, { method: 'POST' });
      setRegistrations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r)
      );
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    try {
      const res = await apiFetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRegistrations(prev => prev.filter(r => r.id !== id));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionId(null);
    }
  };

  const filtered      = registrations.filter(r => filter === 'all' || r.status === filter);
  const pendingCount  = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      {/* Temporary password reveal — shown once after approval */}
      {tempPassword && (
        <div
          className="card p-5 flex items-start gap-4 animate-card-in"
          style={{ border: '1.5px solid rgba(0,166,81,0.35)', background: 'rgba(0,166,81,0.05)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(0,166,81,0.12)' }}
          >
            <KeyRound size={16} style={{ color: '#00A651' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-0.5" style={{ color: '#00A651' }}>
              Account created — share this temporary password
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              The user should log in and change this immediately. It will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {tempPassword}
              </code>
              <button
                onClick={handleCopyPassword}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition pressable"
                style={{
                  background: copied ? 'rgba(0,166,81,0.12)' : 'var(--bg)',
                  border:     '1px solid var(--border)',
                  color:      copied ? '#00A651' : 'var(--text-muted)',
                }}
              >
                <Copy size={12} />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => setTempPassword(null)}
                className="p-2 rounded-lg transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {pendingCount} pending · {approvedCount} approved · {rejectedCount} rejected
        </span>
        {pendingCount > 0 && (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E8A020' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E8A020' }} />
              {pendingCount} awaiting review
            </span>
          </>
        )}
      </PageContext>

      {/* Filter tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', display: 'inline-flex' }}
      >
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 text-xs font-medium rounded-lg transition capitalize"
            style={{
              background: filter === f ? 'var(--sanlam-navy)' : 'transparent',
              color:      filter === f ? 'white'               : 'var(--text-muted)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'pending' ? '✅' : '📝'}
          title={filter === 'pending' ? 'No pending registrations' : `No ${filter} registrations`}
          description={
            filter === 'pending'
              ? 'All registration requests have been reviewed.'
              : `No registrations with status "${filter}".`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((reg, idx) => (
            <div
              key={reg.id}
              className="card p-5 animate-card-in"
              style={{
                background:     'var(--surface)',
                animationDelay: `${idx * 40}ms`,
                borderLeft:     reg.status === 'pending'  ? '4px solid #E8A020'
                              : reg.status === 'approved' ? '4px solid #00A651'
                              : '4px solid #D0021B',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg)' }}
                  >
                    <Building2 size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {reg.companyName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {reg.name} · {reg.email}
                    </p>
                  </div>
                </div>
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: reg.status === 'pending'  ? 'rgba(232,160,32,0.12)'
                              : reg.status === 'approved' ? 'rgba(0,166,81,0.12)'
                              : 'rgba(208,2,27,0.1)',
                    color: reg.status === 'pending'  ? '#E8A020'
                         : reg.status === 'approved' ? '#00A651'
                         : '#D0021B',
                  }}
                >
                  {reg.status === 'pending'  && <Clock size={10} />}
                  {reg.status === 'approved' && <Check size={10} />}
                  {reg.status === 'rejected' && <X    size={10} />}
                  {reg.status}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Industry: <span style={{ color: 'var(--text-primary)' }}>{reg.industry}</span>
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {reg.description}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Submitted: {new Date(reg.requestedAt).toLocaleDateString('en-ZA', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              {reg.status !== 'pending' && (
                <div className="flex justify-end pt-1">
                  {deleteId === reg.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remove this record?</span>
                      <button
                        onClick={() => handleDelete(reg.id)}
                        disabled={actionId === reg.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-60"
                        style={{ background: '#D0021B' }}
                      >
                        {actionId === reg.id
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={11} />}
                        Remove
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs transition"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(reg.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition"
                      style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <Trash2 size={11} />
                      Remove record
                    </button>
                  )}
                </div>
              )}

              {reg.status === 'pending' && (
                <div className="space-y-3">
                  {approveId === reg.id ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        Link to an existing company (optional):
                      </p>
                      <select
                        value={selectedCompany}
                        onChange={e => setSelectedCompany(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs focus:outline-none"
                        style={{
                          background: 'var(--bg)',
                          border:     '1.5px solid var(--border)',
                          color:      'var(--text-primary)',
                        }}
                      >
                        <option value="">No company link (assign later)</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(reg.id)}
                          disabled={actionId === reg.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-60"
                          style={{ background: '#00A651' }}
                        >
                          {actionId === reg.id
                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Check size={13} />}
                          Confirm Approve
                        </button>
                        <button
                          onClick={() => { setApproveId(null); setSelectedCompany(''); }}
                          className="px-3 py-2 rounded-lg text-xs font-medium transition"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setApproveId(reg.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition"
                        style={{ background: '#00A651' }}
                      >
                        <Check size={13} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(reg.id)}
                        disabled={actionId === reg.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-60"
                        style={{
                          background: 'rgba(208,2,27,0.08)',
                          color:      '#D0021B',
                          border:     '1px solid rgba(208,2,27,0.2)',
                        }}
                      >
                        <X size={13} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
