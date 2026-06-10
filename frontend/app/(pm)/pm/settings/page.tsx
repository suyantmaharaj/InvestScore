'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Palette, Bell, Shield, LogOut, Sun, Moon, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme';

type Tab = 'profile' | 'appearance' | 'notifications' | 'account';

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: 'profile',       label: 'Profile',       icon: User    },
  { value: 'appearance',    label: 'Appearance',     icon: Palette },
  { value: 'notifications', label: 'Notifications',  icon: Bell    },
  { value: 'account',       label: 'Account',        icon: Shield  },
];

const NOTIF_TOGGLES = [
  { key: 'newSubmissions',      label: 'New data submissions',       desc: 'When an SME submits new SDG data'          },
  { key: 'riskAlerts',          label: 'Risk alerts',                desc: 'Companies falling below risk thresholds'   },
  { key: 'classificationChange',label: 'Classification changes',     desc: 'Impact tier changes in your portfolio'     },
  { key: 'newOnboarding',       label: 'New company onboarding',     desc: 'When a registration is approved'           },
  { key: 'weeklyDigest',        label: 'Weekly portfolio digest',    desc: 'Summary of portfolio activity each Monday' },
];

function ProfileTab() {
  const { user } = useAuth();
  const [name,  setName]  = useState(user?.name  || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Full Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 focus:outline-none"
              style={{
                background: 'var(--bg)',
                border:     '1px solid var(--border)',
                color:      'var(--text-primary)',
              }}
              onFocus={e  => (e.target.style.borderColor = 'var(--sanlam-teal)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 rounded-xl text-sm cursor-not-allowed"
              style={{
                background: 'var(--bg)',
                border:     '1px solid var(--border)',
                color:      'var(--text-muted)',
                opacity:    0.7,
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Email cannot be changed. Contact your administrator.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Role
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,181,237,0.12)', color: 'var(--sanlam-teal)' }}
              >
                Portfolio Manager
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ background: 'var(--sanlam-teal)', color: '#fff' }}
          >
            {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  const options: { value: 'light' | 'dark'; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'light', label: 'Light',  icon: Sun,     desc: 'Clean white background'        },
    { value: 'dark',  label: 'Dark',   icon: Moon,    desc: 'Easier on the eyes at night'   },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Theme</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Choose how InvestScore looks for you.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => {
            const active = theme === opt.value;
            const Icon   = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => { if (!active) toggleTheme(); }}
                className="flex flex-col items-start gap-3 p-4 rounded-xl transition-all duration-150 text-left"
                style={{
                  background: active ? 'rgba(0,181,237,0.08)' : 'var(--bg)',
                  border:     `2px solid ${active ? 'var(--sanlam-teal)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: active ? 'rgba(0,181,237,0.15)' : 'var(--surface)' }}
                >
                  <Icon size={18} style={{ color: active ? 'var(--sanlam-teal)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
                {active && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--sanlam-teal)', color: '#fff' }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview cards */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Preview</h3>
        <div className="grid grid-cols-3 gap-3">
          {['High Impact', 'Medium Impact', 'Low Impact'].map((label, i) => {
            const colors = ['var(--sanlam-green)', '#F59E0B', '#EF4444'];
            return (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div
                  className="text-2xl font-black mb-1"
                  style={{ color: colors[i] }}
                >
                  {['3.4', '2.1', '1.3'][i]}
                </div>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    newSubmissions:       true,
    riskAlerts:           true,
    classificationChange: true,
    newOnboarding:        false,
    weeklyDigest:         true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Portfolio Notifications</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Choose which events trigger notifications for your portfolio.
        </p>
        <div className="space-y-3">
          {NOTIF_TOGGLES.map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
              <button
                onClick={() => toggle(item.key)}
                className="relative w-10 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                style={{ background: prefs[item.key] ? 'var(--sanlam-teal)' : 'var(--border)' }}
                role="switch"
                aria-checked={prefs[item.key]}
              >
                <span
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: prefs[item.key] ? '22px' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ background: 'var(--sanlam-teal)', color: '#fff' }}
          >
            {saved ? <><Check size={14} /> Saved</> : 'Save preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const { logout } = useAuth();
  const router     = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Platform Information</h3>
        <div className="mt-4 space-y-3">
          {[
            { label: 'Platform',   value: 'InvestScore'          },
            { label: 'Powered by', value: 'Sanlam Investments'   },
            { label: 'Version',    value: '1.0.0'                },
            { label: 'Environment', value: 'Production'          },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Session</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          Signing out will end your current session across all tabs.
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, React.ReactNode> = {
  profile:       <ProfileTab />,
  appearance:    <AppearanceTab />,
  notifications: <NotificationsTab />,
  account:       <AccountTab />,
};

export default function PMSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="min-h-screen p-5 lg:p-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.value;
            const Icon   = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150"
                style={{
                  background: active ? 'var(--bg)'            : 'transparent',
                  color:      active ? 'var(--sanlam-teal)'   : 'var(--text-muted)',
                  boxShadow:  active ? 'var(--shadow-card)'   : 'none',
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {TAB_CONTENT[activeTab]}

      </div>
    </div>
  );
}
