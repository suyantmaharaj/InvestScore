'use client';

import { useState, useEffect } from 'react';
import {
  UserPlus, Trash2, Search,
  Shield, Briefcase, Building2, X, Check, AlertTriangle,
} from 'lucide-react';
import { SkeletonCard } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import Tooltip from '@/components/shared/Tooltip';
import PageContext from '@/components/shared/PageContext';

interface UserRecord {
  uid:       string;
  name:      string;
  email:     string;
  role:      'sme' | 'pm' | 'admin';
  companyId?: string;
  createdAt: string;
}

interface OrphanCompany {
  id:     string;
  name:   string;
  sector: string;
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Shield    size={14} style={{ color: '#FC8181' }} />;
  if (role === 'pm')    return <Briefcase size={14} style={{ color: '#00B5ED' }} />;
  return <Building2 size={14} style={{ color: '#00A651' }} />;
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    admin: { bg: 'rgba(208,2,27,0.1)',  color: '#FC8181', label: 'Admin'            },
    pm:    { bg: 'rgba(0,181,237,0.1)', color: '#00B5ED', label: 'Portfolio Manager' },
    sme:   { bg: 'rgba(0,166,81,0.1)',  color: '#00A651', label: 'SME User'          },
  };
  const s = styles[role] || styles.sme;
  return (
    <span
      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      <RoleIcon role={role} />
      {s.label}
    </span>
  );
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

export default function UsersPage() {
  const [users,      setUsers]      = useState<UserRecord[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'sme' | 'pm' | 'admin'>('all');
  const [deleteUid,  setDeleteUid]  = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const [orphans, setOrphans] = useState<OrphanCompany[]>([]);

  const [showCreate,    setShowCreate]    = useState(false);
  const [newName,       setNewName]       = useState('');
  const [newEmail,      setNewEmail]      = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [newRole,       setNewRole]       = useState<'pm' | 'sme'>('pm');
  const [newCompanyId,  setNewCompanyId]  = useState('');
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, orphansRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/orphan-companies'),
      ]);
      const usersJson   = await usersRes.json();
      const orphansJson = await orphansRes.json();
      setUsers(usersJson.users || []);
      setOrphans(orphansJson.companies || []);
    } catch (err) {
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (uid: string) => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/users/${uid}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.uid !== uid));
        setDeleteUid(null);
      }
    } catch (err) {
      console.error('Delete user error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const prefillOrphan = (company: OrphanCompany) => {
    setNewRole('sme');
    setNewCompanyId(company.id);
    setShowCreate(true);
    setCreateError('');
    setCreateSuccess(false);
  };

  const handleCreate = async () => {
    if (!newName || !newEmail || !newPassword) {
      setCreateError('All fields are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res  = await apiFetch('/api/admin/users', {
        method: 'POST',
        body:   JSON.stringify({
          name:      newName,
          email:     newEmail,
          password:  newPassword,
          role:      newRole,
          companyId: newRole === 'sme' && newCompanyId ? newCompanyId : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || 'Failed to create user.');
      } else {
        setCreateSuccess(true);
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewCompanyId('');
        await loadUsers();
        setTimeout(() => { setCreateSuccess(false); setShowCreate(false); }, 1500);
      }
    } catch {
      setCreateError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const inputStyle: React.CSSProperties = {
    background:   'var(--bg)',
    border:       '1.5px solid var(--border)',
    color:        'var(--text-primary)',
    borderRadius: '10px',
    height:       '40px',
    padding:      '0 12px',
    fontSize:     '14px',
    width:        '100%',
    outline:      'none',
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SkeletonCard className="h-16" />
        {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {users.length} total users
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {users.filter(u => u.role === 'sme').length} SME ·{' '}
          {users.filter(u => u.role === 'pm').length} PM ·{' '}
          {users.filter(u => u.role === 'admin').length} Admin
        </span>
      </PageContext>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ ...inputStyle, paddingLeft: '32px' }}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'sme', 'pm', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 text-xs rounded-lg border font-medium transition-all"
              style={{
                background:  roleFilter === r ? 'var(--sanlam-teal)' : 'var(--surface)',
                color:       roleFilter === r ? 'white'               : 'var(--text-muted)',
                borderColor: roleFilter === r ? 'var(--sanlam-teal)' : 'var(--border)',
              }}
            >
              {r === 'all' ? 'All' : r.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ml-auto transition-all"
          style={{
            background: showCreate ? 'var(--bg)' : 'var(--sanlam-teal)',
            color:      showCreate ? 'var(--text-muted)' : 'white',
            border:     showCreate ? '1px solid var(--border)' : 'none',
          }}
        >
          {showCreate ? <X size={14} /> : <UserPlus size={14} />}
          {showCreate ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <div
          className="card p-5 animate-fade-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--sanlam-teal)' }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Create New User
          </p>
          {createError && (
            <p className="text-xs mb-3" style={{ color: '#D0021B' }}>{createError}</p>
          )}
          {createSuccess && (
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#00A651' }}>
              <Check size={13} /> User created successfully.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Full name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Lerato Dlamini" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="user@company.co.za" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="••••••••" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Role</label>
              <select
                value={newRole}
                onChange={e => { setNewRole(e.target.value as 'pm' | 'sme'); if (e.target.value !== 'sme') setNewCompanyId(''); }}
                style={inputStyle}
              >
                <option value="pm">Portfolio Manager</option>
                <option value="sme">SME User</option>
              </select>
            </div>
            {newRole === 'sme' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Link to Company {newCompanyId && <span style={{ color: '#00A651' }}>✓ pre-filled</span>}
                </label>
                <select value={newCompanyId} onChange={e => setNewCompanyId(e.target.value)} style={inputStyle}>
                  <option value="">Select company (optional)</option>
                  {orphans.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'var(--sanlam-teal)' }}
          >
            {creating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
            ) : (
              <><Check size={14} /> Create User</>
            )}
          </button>
        </div>
      )}

      {/* Companies without accounts */}
      {orphans.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: '#E8A020' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#E8A020' }}>
              {orphans.length} {orphans.length === 1 ? 'Company' : 'Companies'} without login accounts
            </p>
          </div>
          <div className="space-y-2">
            {orphans.map((c, idx) => (
              <div
                key={c.id}
                className="card p-4 flex items-center justify-between gap-4 animate-card-in"
                style={{ background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)', animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(232,160,32,0.15)' }}
                  >
                    <Building2 size={16} style={{ color: '#E8A020' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                    <p className="text-xs truncate capitalize" style={{ color: 'var(--text-muted)' }}>
                      {(c.sector || 'unknown').replace(/_/g, ' ')} · No user account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => prefillOrphan(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all hover:opacity-80"
                  style={{ background: 'rgba(232,160,32,0.15)', color: '#E8A020', border: '1px solid rgba(232,160,32,0.3)' }}
                >
                  <UserPlus size={12} />
                  Create Account
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User list */}
      {filtered.length === 0 ? (
        <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map((u, idx) => (
            <div
              key={u.uid}
              className="card p-4 flex items-center justify-between gap-4 animate-card-in"
              style={{ background: 'var(--surface)', animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{
                    background: u.role === 'admin' ? '#D0021B' : u.role === 'pm' ? 'var(--sanlam-teal)' : 'var(--sanlam-green)',
                  }}
                >
                  {u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <RoleBadge role={u.role} />
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                {u.role !== 'admin' && (
                  deleteUid === u.uid ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: '#D0021B' }}>Confirm?</p>
                      <button
                        onClick={() => handleDelete(u.uid)}
                        disabled={deleting}
                        className="px-2 py-1 text-xs rounded-lg font-semibold transition"
                        style={{ background: 'rgba(208,2,27,0.1)', color: '#D0021B' }}
                      >
                        {deleting ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setDeleteUid(null)}
                        className="px-2 py-1 text-xs rounded-lg font-semibold transition"
                        style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <Tooltip content="Delete user" position="left">
                      <button
                        onClick={() => setDeleteUid(u.uid)}
                        className="p-1.5 rounded-lg transition hover:opacity-80"
                        style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
