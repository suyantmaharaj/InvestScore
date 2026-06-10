'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { TrendingUp, X, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function LearningTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const isHub = pathname === '/learning';
  const isCourse = pathname.startsWith('/learning/course/');
  const isLesson = pathname.startsWith('/learning/lesson/');

  const step = parseInt(params.get('step') || '0', 10);
  const total = parseInt(params.get('total') || '0', 10);
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;

  const handleBack = () => {
    if (isLesson) {
      const courseId = params.get('course');
      router.push(courseId ? `/learning/course/${courseId}` : '/learning');
    } else if (isCourse) {
      router.push('/learning');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          zIndex: 50,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '12px',
        }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-medium transition-all rounded-lg px-2 py-1.5"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={16} />
          {isLesson ? 'Back to course' : isHub ? 'Dashboard' : 'Back'}
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <TrendingUp size={18} style={{ color: 'var(--sanlam-teal)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Learning Centre
          </span>
          {isLesson && total > 0 && (
            <div className="flex items-center gap-1.5 ml-4">
              {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i < step ? '8px' : '6px',
                    height: i < step ? '8px' : '6px',
                    background: i < step ? 'var(--sanlam-teal)' : 'var(--border)',
                  }}
                />
              ))}
              {total > 8 && (
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  {step}/{total}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {!isHub && (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <X size={13} />
            Exit
          </button>
        )}
      </nav>

      {isLesson && total > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--border)',
            zIndex: 49,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'var(--sanlam-teal)',
              transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      )}
    </>
  );
}
