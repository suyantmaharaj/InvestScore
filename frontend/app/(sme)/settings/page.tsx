'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Bell, Palette, Shield,
  Save, LogOut, RefreshCw, CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';
import PageContext from '@/components/shared/PageContext';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'account';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       icon: User,    label: 'Profile'       },
  { id: 'appearance',    icon: Palette, label: 'Appearance'    },
  { id: 'notifications', icon: Bell,    label: 'Notifications' },
  { id: 'account',       icon: Shield,  label: 'Account'       },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function SettingsSection({ title, description, children }: {
  title:       string;
  description: string;
  children:    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function SettingsRow({ label, description, children }: {
  label:        string;
  description?: string;
  children:     React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none"
      style={{ background: value ? 'var(--sanlam-teal)' : 'var(--border-strong)' }}
      role="switch"
      aria-checked={value}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router                 = useRouter();
  const { user, logout }       = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved,     setSaved]     = useState(false);

  const [name,    setName]    = useState(user?.name  || '');
  const [email,   setEmail]   = useState(user?.email || '');
  const [company, setCompany] = useState('');
  const [title,   setTitle]   = useState('');

  const [emailAlerts,  setEmailAlerts]  = useState(true);
  const [scoreUpdates, setScoreUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [peerAlerts,   setPeerAlerts]   = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  const inputStyle = {
    background: 'var(--bg)',
    border:     '1.5px solid var(--border)',
    color:      'var(--text-primary)',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-in">

      <PageContext>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Account: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
        </span>
        <div className="w-px h-4" style={{ background: 'var(--border)' }} />
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)' }}
        >
          SME User
        </span>
      </PageContext>

      <div className="flex gap-6">

        {/* Tab sidebar - desktop */}
        <div className="w-52 flex-shrink-0 hidden md:block">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {TABS.map(tab => {
              const Icon   = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150"
                  style={{
                    background: active ? 'var(--bg)' : 'transparent',
                    borderLeft: active ? '3px solid var(--sanlam-teal)' : '3px solid transparent',
                  }}
                >
                  <Icon size={16} style={{ color: active ? 'var(--sanlam-teal)' : 'var(--text-muted)' }} />
                  <p className="text-sm font-medium" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {tab.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab pills - mobile */}
        <div className="md:hidden flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background:  activeTab === tab.id ? 'var(--sanlam-teal)' : 'var(--surface)',
                color:       activeTab === tab.id ? 'white' : 'var(--text-muted)',
                borderColor: activeTab === tab.id ? 'var(--sanlam-teal)' : 'var(--border)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-fade-in">
              <SettingsSection title="Personal Information" description="Update your name and contact details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full name',     value: name,    set: setName,    type: 'text',  placeholder: ''                  },
                    { label: 'Email address', value: email,   set: setEmail,   type: 'email', placeholder: ''                  },
                    { label: 'Company name',  value: company, set: setCompany, type: 'text',  placeholder: 'e.g. Khaya Capital' },
                    { label: 'Job title',     value: title,   set: setTitle,   type: 'text',  placeholder: 'e.g. CEO'          },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{ ...inputStyle, focusRingColor: 'var(--sanlam-teal)' } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </SettingsSection>

              <SettingsSection title="Avatar" description="Your avatar is automatically generated from your name">
                <SettingsRow label="Profile avatar" description="Generated from your initials, no upload needed">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base"
                      style={{ background: '#00B5ED' }}
                    >
                      {getInitials(name || user?.name || 'User')}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Updates automatically<br />when you change your name
                    </p>
                  </div>
                </SettingsRow>
              </SettingsSection>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 animate-fade-in">
              <SettingsSection title="Theme" description="Choose how InvestScore looks for you">
                <SettingsRow label="Colour theme" description="Switch between light and dark mode">
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                    <Toggle value={theme === 'dark'} onChange={toggleTheme} />
                  </div>
                </SettingsRow>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { id: 'light', label: 'Light', bg: '#F4F6F8', surface: '#FFFFFF', accent: '#00B5ED' },
                    { id: 'dark',  label: 'Dark',  bg: '#0F172A', surface: '#1E293B', accent: '#00B5ED' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => t.id !== theme && toggleTheme()}
                      className="rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        border:    theme === t.id ? '2px solid var(--sanlam-teal)' : '2px solid var(--border)',
                        boxShadow: theme === t.id ? '0 0 0 3px rgba(0,181,237,0.15)' : 'none',
                      }}
                    >
                      <div className="p-3" style={{ background: t.bg }}>
                        <div className="rounded-lg p-2 mb-2" style={{ background: t.surface }}>
                          <div className="flex gap-1.5 mb-1.5">
                            <div className="w-8 h-1.5 rounded-full" style={{ background: t.accent }} />
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: t.bg }} />
                          </div>
                          <div className="w-full h-1 rounded-full" style={{ background: t.bg }} />
                        </div>
                        <div className="flex gap-1.5">
                          {[t.accent, '#00A651', '#E8A020'].map(c => (
                            <div key={c} className="flex-1 h-6 rounded-lg" style={{ background: c, opacity: 0.8 }} />
                          ))}
                        </div>
                      </div>
                      <div
                        className="py-2 text-center text-xs font-semibold"
                        style={{
                          background: t.surface,
                          color:      theme === t.id ? 'var(--sanlam-teal)' : 'var(--text-muted)',
                        }}
                      >
                        {t.label}{theme === t.id && ' ✓'}
                      </div>
                    </button>
                  ))}
                </div>
              </SettingsSection>

              <SettingsSection title="Display" description="Adjust how data is presented">
                <SettingsRow label="Compact mode"    description="Reduce spacing to show more content on screen"><Toggle value={false} onChange={() => {}} /></SettingsRow>
                <SettingsRow label="Animate scores"  description="Count-up animation when scores load"><Toggle value={true}  onChange={() => {}} /></SettingsRow>
                <SettingsRow label="Show SDG icons"  description="Display emoji icons on SDG cards"><Toggle value={true}  onChange={() => {}} /></SettingsRow>
              </SettingsSection>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-fade-in">
              <SettingsSection title="Email Notifications" description="Choose which emails you receive from InvestScore">
                <SettingsRow label="Score updates"        description="Get notified when your SDG scores are recalculated"><Toggle value={scoreUpdates} onChange={setScoreUpdates} /></SettingsRow>
                <SettingsRow label="Email alerts"         description="Receive emails when a goal drops below your target"><Toggle value={emailAlerts}  onChange={setEmailAlerts}  /></SettingsRow>
                <SettingsRow label="Weekly digest"        description="A summary of your SDG performance every Monday"><Toggle value={weeklyDigest} onChange={setWeeklyDigest} /></SettingsRow>
                <SettingsRow label="Peer benchmark alerts" description="Get notified when your sector ranking changes"><Toggle value={peerAlerts}   onChange={setPeerAlerts}   /></SettingsRow>
              </SettingsSection>

              <SettingsSection title="In-App Alerts" description="Alerts shown inside the InvestScore platform">
                <SettingsRow label="Low score warnings"     description="Show the amber alert banner when any goal drops to Low"><Toggle value={true} onChange={() => {}} /></SettingsRow>
                <SettingsRow label="Submission reminders"   description="Remind me to submit data each quarter"><Toggle value={true} onChange={() => {}} /></SettingsRow>
              </SettingsSection>
            </div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-5 animate-fade-in">
              <SettingsSection title="Session" description="Manage your active session">
                <SettingsRow label="Current session" description={`Signed in as ${user?.email}`}>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: 'rgba(208,2,27,0.08)', color: 'var(--sanlam-red)', border: '1px solid rgba(208,2,27,0.2)' }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection title="Demo Controls" description="Reset or reload demo data for this account">
                <SettingsRow label="Reset demo data" description="Reload the seeded scorecard data for this account">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    <RefreshCw size={14} />
                    Reset
                  </button>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection title="About" description="Platform information">
                <div className="space-y-2">
                  {[
                    { label: 'Platform',  value: 'InvestScore'                    },
                    { label: 'Version',   value: '1.0.0 (Demo Build)'            },
                    { label: 'Challenge', value: 'Twin Transition Challenge 2026' },
                    { label: 'Partner',   value: 'Sanlam Investments'            },
                    { label: 'Built by',  value: 'UCT Information Systems Team'  },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Save button */}
          {(activeTab === 'profile' || activeTab === 'notifications') && (
            <div className="flex items-center gap-3 justify-end">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium animate-fade-in" style={{ color: 'var(--sanlam-green)' }}>
                  <CheckCircle size={15} />
                  Saved successfully
                </span>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'var(--sanlam-teal)' }}
              >
                <Save size={15} />
                Save changes
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
