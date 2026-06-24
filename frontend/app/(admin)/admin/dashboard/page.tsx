'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Building2, ClipboardList,
  UserPlus, Brain, AlertTriangle,
  Shield, CheckCircle, XCircle, ExternalLink, Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import AnimatedScore from '@/components/shared/AnimatedScore';
import { formatFileSize, getFileIcon } from '@/lib/storage-upload';

interface AdminStats {
  totalUsers:           number;
  smeCount:             number;
  pmCount:              number;
  adminCount:           number;
  activeCompanies:      number;
  totalSubmissions:     number;
  pendingRegistrations: number;
  companiesWithoutUsers: number;
}

export default function AdminDashboardPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const [stats,        setStats]        = useState<AdminStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [pendingBBBEE, setPendingBBBEE] = useState<any[]>([]);
  const [showRejectId, setShowRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewingId,  setReviewingId]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadBBBEE = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/bbbee/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setPendingBBBEE(json.verifications || []);
      } catch (err) {
        console.error('Load B-BBEE error:', err);
      }
    };
    loadBBBEE();
  }, [user]);

  const handleReview = async (verificationId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) return;
    setReviewingId(verificationId);
    try {
      const { auth } = await import('@/lib/firebase');
      const token    = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/bbbee/${verificationId}/review`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ decision: action, rejectionReason: rejectionReason.trim() || undefined }),
      });
      setPendingBBBEE(prev => prev.filter(v => v.id !== verificationId));
      setShowRejectId(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <SkeletonCard key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,       iconColor: '#00B5ED',
      value: stats?.totalUsers ?? 0,
      label: 'Total Users',
      sub:   `${stats?.smeCount ?? 0} SME · ${stats?.pmCount ?? 0} PM · ${stats?.adminCount ?? 0} Admin`,
      subColor: 'var(--text-muted)',
      href:  '/admin/users',
      delay: 'delay-50',
    },
    {
      icon: Building2,   iconColor: '#00A651',
      value: stats?.activeCompanies ?? 0,
      label: 'Active Companies',
      sub:   'In the 104+ portfolio',
      subColor: '#00A651',
      href:  null,
      delay: 'delay-100',
    },
    {
      icon: ClipboardList, iconColor: '#00B5ED',
      value: stats?.totalSubmissions ?? 0,
      label: 'Scored Submissions',
      sub:   'Total SDG data submissions',
      subColor: 'var(--text-muted)',
      href:  null,
      delay: 'delay-150',
    },
    {
      icon: UserPlus,
      iconColor: stats?.pendingRegistrations ? '#E8A020' : '#00A651',
      value: stats?.pendingRegistrations ?? 0,
      label: 'Pending Registrations',
      sub:   stats?.pendingRegistrations ? 'Awaiting review' : 'All clear',
      subColor: stats?.pendingRegistrations ? '#E8A020' : '#00A651',
      href:  '/admin/registrations',
      delay: 'delay-200',
    },
  ];

  const quickActions = [
    {
      icon: UserPlus, color: '#00B5ED', bg: 'rgba(0,181,237,0.1)',
      title: 'Review Registrations',
      desc:  'Approve or reject pending SME sign-up requests',
      href:  '/admin/registrations',
    },
    {
      icon: Users, color: '#00A651', bg: 'rgba(0,166,81,0.1)',
      title: 'Manage Users',
      desc:  'Create, view, or remove PM and SME accounts',
      href:  '/admin/users',
    },
    {
      icon: Brain, color: '#6366F1', bg: 'rgba(99,102,241,0.1)',
      title: 'Edit AI Context',
      desc:  'Update the coaching rules the AI Coach uses',
      href:  '/admin/ai-context',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      {stats?.pendingRegistrations ? (
        <PageContext>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E8A020' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E8A020' }} />
            {stats.pendingRegistrations} registration{stats.pendingRegistrations > 1 ? 's' : ''} pending
          </span>
        </PageContext>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, iconColor, value, label, sub, subColor, href, delay }) => (
          <div
            key={label}
            className={`card p-5 animate-card-in ${delay} ${href ? 'card-interactive' : ''}`}
            style={{ background: 'var(--surface)' }}
            onClick={() => href && router.push(href)}
          >
            <Icon size={20} style={{ color: iconColor }} className="mb-3" />
            <AnimatedScore
              value={value}
              decimals={0}
              raw
              className="font-bold text-2xl block mb-0.5"
              style={{ color: 'var(--text-primary)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Companies-without-users warning */}
      {(stats?.companiesWithoutUsers ?? 0) > 0 && (
        <button
          onClick={() => router.push('/admin/users')}
          className="w-full card card-interactive p-4 flex items-center gap-4 text-left animate-card-in"
          style={{ background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.3)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(232,160,32,0.15)' }}
          >
            <AlertTriangle size={20} style={{ color: '#E8A020' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#E8A020' }}>
              {stats!.companiesWithoutUsers} compan{stats!.companiesWithoutUsers === 1 ? 'y' : 'ies'} without login accounts
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              These active portfolio companies have no linked user account. Create accounts in User Management.
            </p>
          </div>
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#E8A020' }}>
            Fix now →
          </span>
        </button>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(({ icon: Icon, color, bg, title, desc, href }, i) => (
            <button
              key={title}
              onClick={() => router.push(href)}
              className="card card-interactive p-5 text-left animate-card-in"
              style={{ background: 'var(--surface)', animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: bg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* B-BBEE Verification Queue — always rendered so tour can find it */}
      <div data-tour="admin-bbbee-queue">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: 'var(--sanlam-teal)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            B-BBEE Certificates Pending Verification
          </h2>
          {pendingBBBEE.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: 'rgba(232,160,32,0.15)', color: '#E8A020' }}
            >
              {pendingBBBEE.length}
            </span>
          )}
        </div>
        {pendingBBBEE.length === 0 ? (
          <div
            className="card p-4 flex items-center gap-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <CheckCircle size={18} style={{ color: '#00A651', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>All clear</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No B-BBEE certificates awaiting verification.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBBBEE.map(v => (
              <div
                key={v.id}
                className="card p-4 animate-card-in"
                style={{ background: 'var(--surface)', border: '1px solid rgba(232,160,32,0.2)' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{getFileIcon(v.originalName)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {v.originalName}
                      </p>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
                      >
                        Claimed Level {v.claimedLevel}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(232,160,32,0.1)', color: '#E8A020', border: '1px solid rgba(232,160,32,0.2)' }}
                      >
                        <Clock size={10} /> Pending
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {v.companyId} · {formatFileSize(v.fileSize)} ·{' '}
                      {new Date(v.submittedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <a
                      href={v.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium mt-1.5 hover:underline"
                      style={{ color: 'var(--sanlam-teal)' }}
                    >
                      <ExternalLink size={11} /> View certificate
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(v.id, 'approve')}
                      disabled={reviewingId === v.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white pressable disabled:opacity-60"
                      style={{ background: '#00A651' }}
                    >
                      <CheckCircle size={13} />
                      {reviewingId === v.id ? 'Saving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setShowRejectId(showRejectId === v.id ? null : v.id)}
                      disabled={reviewingId === v.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold pressable disabled:opacity-60"
                      style={{ background: 'rgba(208,2,27,0.1)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.2)' }}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                </div>

                {showRejectId === v.id && (
                  <div
                    className="mt-3 pt-3 animate-card-in"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <input
                      type="text"
                      placeholder="Reason for rejection (required)"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg text-xs focus:outline-none mb-2"
                      style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => handleReview(v.id, 'reject')}
                      disabled={!rejectionReason.trim() || reviewingId === v.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white pressable disabled:opacity-50"
                      style={{ background: '#D0021B' }}
                    >
                      Confirm rejection
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform info */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Platform Info
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Platform',  value: 'InvestScore'           },
            { label: 'Version',   value: '1.0.0 (Demo Build)'    },
            { label: 'Challenge', value: 'Twin Transition 2026'   },
            { label: 'Partner',   value: 'Sanlam Investments'     },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
