'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Building2 } from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import PageContext from '@/components/shared/PageContext';

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
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState<string | null>(null);
  const [filter,        setFilter]        = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

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

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      await apiFetch(`/api/admin/registrations/${id}/${action}`, { method: 'POST' });
      setRegistrations(prev =>
        prev.map(r => r.id === id
          ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
          : r
        )
      );
    } catch (err) {
      console.error('Registration action error:', err);
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
      <div className="max-w-3xl mx-auto space-y-4">
        {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-page-in">

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
              color:      filter === f ? 'white'              : 'var(--text-muted)',
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

              {reg.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(reg.id, 'approve')}
                    disabled={actionId === reg.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition disabled:opacity-60"
                    style={{ background: '#00A651' }}
                  >
                    {actionId === reg.id
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Check size={13} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(reg.id, 'reject')}
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
          ))}
        </div>
      )}

    </div>
  );
}
