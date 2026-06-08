'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Building2, ClipboardList,
  UserPlus, Brain, TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonCard } from '@/components/shared/Skeleton';
import PageContext from '@/components/shared/PageContext';
import AnimatedScore from '@/components/shared/AnimatedScore';

interface AdminStats {
  totalUsers:           number;
  smeCount:             number;
  pmCount:              number;
  adminCount:           number;
  activeCompanies:      number;
  totalSubmissions:     number;
  pendingRegistrations: number;
}

export default function AdminDashboardPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token    = await auth.currentUser?.getIdToken();
        const res      = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
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
    <div className="max-w-5xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(208,2,27,0.1)', color: '#FC8181' }}
        >
          Administrator
        </span>
        {stats?.pendingRegistrations ? (
          <>
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E8A020' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E8A020' }} />
              {stats.pendingRegistrations} registration{stats.pendingRegistrations > 1 ? 's' : ''} pending
            </span>
          </>
        ) : null}
      </PageContext>

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
              className="font-bold text-2xl block mb-0.5"
              style={{ color: 'var(--text-primary)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
          </div>
        ))}
      </div>

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
              className={`card card-interactive p-5 text-left animate-card-in delay-${(i + 1) * 100}`}
              style={{ background: 'var(--surface)' }}
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

      {/* Platform info */}
      <div className="card p-5" style={{ background: 'var(--surface)' }}>
        <p className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Platform Info
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Platform',  value: 'InvestScore'           },
            { label: 'Version',   value: '1.0.0 — Demo Build'    },
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
