'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TourStep {
  title:       string;
  description: string;
  icon:        string;
  action?:     { label: string; href: string };
}

const STEPS: TourStep[] = [
  {
    title:       'Welcome to InvestScore',
    description: 'This is your SDG impact dashboard. You can track your sustainability performance, submit your data, and get personalised coaching from our AI.',
    icon:        '👋',
  },
  {
    title:       'Your SDG Scorecard',
    description: 'See your scores across all 17 Sustainable Development Goals out of 100. Each goal is classified as High, Medium, or Low Impact based on your submitted data.',
    icon:        '🎯',
    action:      { label: 'View my scorecard', href: '/scorecard' },
  },
  {
    title:       'Submit Your Data',
    description: 'Fill in your KPI values every quarter. The scoring engine processes them within minutes and your scorecard updates automatically.',
    icon:        '📋',
    action:      { label: 'Go to submission', href: '/submit' },
  },
  {
    title:       'AI Coach',
    description: 'Ask your AI Coach anything about your SDG scores. It knows your company\'s data and can give personalised, actionable advice for improvement.',
    icon:        '🤖',
    action:      { label: 'Talk to AI Coach', href: '/coach' },
  },
  {
    title:       'Learning Centre',
    description: 'Explore lessons on each SDG goal. Build skills, complete courses, and earn certificates that show your sustainability knowledge.',
    icon:        '📚',
    action:      { label: 'Explore learning', href: '/learning' },
  },
];

export function useOnboarding() {
  const [show, setShow] = useState(true); // always show for demo

  const complete = () => {
    setShow(false);
  };

  return { show, complete };
}

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const current  = STEPS[step];
  const isLast   = step === STEPS.length - 1;
  const isFirst  = step === 0;

  const handleAction = () => {
    if (current.action) router.push(current.action.href);
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-card-in"
        style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          boxShadow:    '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        {/* Top teal bar */}
        <div className="h-1 w-full" style={{ background: 'var(--sanlam-teal)' }} />

        <div className="p-6">
          {/* Close */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:      i === step ? '20px' : '6px',
                    height:     '6px',
                    background: i === step ? 'var(--sanlam-teal)' : i < step ? 'var(--sanlam-green)' : 'var(--border)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={onComplete}
              className="p-1.5 rounded-lg transition"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: 'rgba(0,181,237,0.08)', border: '1px solid rgba(0,181,237,0.15)' }}
            >
              {current.icon}
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {current.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {current.description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <div className="flex-1" />

            {current.action && (
              <button
                onClick={handleAction}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: 'rgba(0,181,237,0.1)', color: 'var(--sanlam-teal)', border: '1px solid rgba(0,181,237,0.2)' }}
              >
                {current.action.label}
              </button>
            )}

            <button
              onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: 'var(--sanlam-teal)' }}
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>

          {!isLast && (
            <button
              onClick={onComplete}
              className="mt-3 w-full text-center text-xs transition"
              style={{ color: 'var(--text-muted)' }}
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
