'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, ClipboardList } from 'lucide-react';

interface Props {
  lastSubmissionDate: string | null;
  lastSubmissionData?: Record<string, number | null> | null;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function formatDaysAgo(days: number): string {
  if (days < 30) return `${days} days ago`;
  if (days < 60) return 'about a month ago';
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

export default function QuarterlyReminder({ lastSubmissionDate, lastSubmissionData }: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(() => {
    try {
      const key = `reminder_dismissed_${new Date().toISOString().slice(0, 7)}`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed || !lastSubmissionDate) return null;

  const days = daysSince(lastSubmissionDate);
  if (days < 80) return null;

  const isOverdue = days >= 90;
  const bg = isOverdue ? 'rgba(208,2,27,0.06)' : 'rgba(232,160,32,0.06)';
  const border = isOverdue ? 'rgba(208,2,27,0.2)' : 'rgba(232,160,32,0.2)';
  const leftBorder = isOverdue ? '#D0021B' : '#E8A020';

  const handleDismiss = () => {
    try {
      const key = `reminder_dismissed_${new Date().toISOString().slice(0, 7)}`;
      localStorage.setItem(key, 'true');
    } catch {}
    setDismissed(true);
  };

  return (
    <div
      className="rounded-xl p-4 flex items-start justify-between gap-3 animate-fade-in"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${leftBorder}`,
      }}
    >
      <div className="flex items-start gap-3 flex-1">
        <Bell size={16} style={{ color: leftBorder, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: leftBorder }}>
            {isOverdue ? 'Quarterly data submission overdue' : 'Quarterly data submission due soon'}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Your last submission was <strong style={{ color: 'var(--text-primary)' }}>{formatDaysAgo(days)}</strong>.
            {isOverdue
              ? ' Submitting updated data will recalculate your scores and keep your portfolio record current.'
              : ' Your next quarterly submission window is opening. Submit soon to keep your scores up to date.'
            }
          </p>
          {lastSubmissionData && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Your previous data is pre-filled in the submission form. Update what has changed.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push('/submit')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition"
          style={{ background: leftBorder }}
        >
          <ClipboardList size={12} />
          Submit data
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg transition"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Dismiss reminder"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
