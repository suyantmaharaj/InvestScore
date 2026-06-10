'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronLeft, ChevronRight, Save, Send } from 'lucide-react';
import { useSMEContext } from '@/context/SMEDataContext';
import { FORM_CATEGORIES, FormKPI } from '@/lib/kpi-form';
import HelpChip from '@/components/sme/HelpChip';
import { invalidateCache } from '@/lib/queryClient';

const PERIOD = 'Q2 2026';
const API    = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getBearerToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase');
  return (await auth.currentUser?.getIdToken()) ?? null;
}

function KPIField({
  kpi, value, onChange, error,
}: {
  kpi:      FormKPI;
  value:    string;
  onChange: (id: string, val: string) => void;
  error?:   string;
}) {
  const isZAR = kpi.unit === 'ZAR';

  return (
    <div className="mb-5">
      {/* Label row */}
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <label className="text-sm font-medium flex items-center gap-1"
          style={{ color: 'var(--c-navy, #015376)' }}>
          {kpi.label}
          {kpi.required && <span className="text-red-500 text-xs">*</span>}
        </label>
        <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--c-muted, #4A5568)' }}>
          {kpi.unit}
        </span>
      </div>

      <HelpChip title={kpi.helpTitle} helpText={kpi.helpText} calculation={kpi.calculation} />

      {/* Input */}
      <div className="relative mt-2">
        {isZAR && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: 'var(--c-muted, #4A5568)' }}>R</span>
        )}
        {kpi.isPercentage && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: 'var(--c-muted, #4A5568)' }}>%</span>
        )}
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={e => onChange(kpi.id, e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder={kpi.placeholder}
          className="w-full h-11 rounded-lg text-sm transition focus:outline-none focus:ring-2"
          style={{
            paddingLeft:  isZAR ? 28 : 12,
            paddingRight: kpi.isPercentage ? 28 : 12,
            border:       `1px solid ${error ? '#D0021B' : 'var(--c-border, #DDE3EC)'}`,
            background:   error ? '#FEE2E2' : 'var(--c-input, #fff)',
            color:        'var(--c-navy, #015376)',
            // @ts-expect-error CSS custom property used by Tailwind's focus ring.
            '--tw-ring-color': '#00B5ED',
          }}
        />
      </div>

      {error && <p className="text-xs mt-1" style={{ color: '#D0021B' }}>{error}</p>}
    </div>
  );
}

export default function SubmitPage() {
  const router = useRouter();
  const { company } = useSMEContext();

  const [step,       setStep]       = useState(0);
  const [values,     setValues]     = useState<Record<string, string>>({});
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [newScore,   setNewScore]   = useState<{ score: number; classification: string } | null>(null);

  // Pre-fill from existing draft or seeded scorecard data
  useEffect(() => {
    if (!company?.id) return;
    const loadDraft = async () => {
      try {
        const token = await getBearerToken();
        if (!token) return;
        const res  = await fetch(`${API}/api/submissions/draft?companyId=${company.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.draft?.data) {
          const pre: Record<string, string> = {};
          Object.entries(json.draft.data).forEach(([k, v]) => {
            if (v !== null && v !== undefined) pre[k] = String(v);
          });
          setValues(pre);
        }
      } catch {}
    };
    loadDraft();
  }, [company?.id]);

  const currentCategory = FORM_CATEGORIES[step];
  const totalSteps      = FORM_CATEGORIES.length;

  const handleChange = (id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
    if (errors[id]) setErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const kpi of currentCategory.kpis) {
      if (!kpi.required) continue;
      const v = values[kpi.id];
      if (!v?.trim()) { newErrors[kpi.id] = 'This field is required.'; continue; }
      const num = parseFloat(v);
      if (isNaN(num))                              { newErrors[kpi.id] = 'Please enter a valid number.'; continue; }
      if (kpi.min !== undefined && num < kpi.min)  { newErrors[kpi.id] = `Minimum value is ${kpi.min}.`; continue; }
      if (kpi.max !== undefined && num > kpi.max)  { newErrors[kpi.id] = `Maximum value is ${kpi.max}.`; }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const numericValues = () => {
    const out: Record<string, number | null> = {};
    Object.entries(values).forEach(([k, v]) => { out[k] = v !== '' ? parseFloat(v) : null; });
    return out;
  };

  const saveDraft = useCallback(async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const token = await getBearerToken();
      if (!token) return;
      await fetch(`${API}/api/submissions/save-draft`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: company.id, data: numericValues(), period: PERIOD }),
      });
    } catch {}
    finally { setSaving(false); }
  }, [company?.id, values]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = async () => {
    if (!validateStep()) return;
    await saveDraft();
    setStep(s => Math.min(s + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep() || !company?.id) return;
    setSubmitting(true);
    try {
      const token = await getBearerToken();
      if (!token) return;
      const res  = await fetch(`${API}/api/submissions/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: company.id, data: numericValues(), period: PERIOD }),
      });
      const json = await res.json();
      if (json.success) {
        invalidateCache('sme_data_');
        setNewScore({ score: json.overallScore, classification: json.classification });
        setSubmitted(true);
      }
    } catch (err) { console.error('Submit error:', err); }
    finally { setSubmitting(false); }
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (submitted && newScore) {
    const sc = newScore.score >= 2.4 ? '#00A651' : newScore.score >= 1.6 ? '#E8A020' : '#D0021B';
    const classBg = newScore.score >= 2.4 ? '#DCFCE7' : newScore.score >= 1.6 ? '#FEF9C3' : '#FEE2E2';
    const classTx = newScore.score >= 2.4 ? '#166534' : newScore.score >= 1.6 ? '#854D0E' : '#991B1B';

    return (
      <div className="max-w-lg mx-auto text-center pt-16 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: '#DCFCE7' }}>
          <CheckCircle size={40} style={{ color: '#00A651' }} />
        </div>
        <h1 className="font-bold text-2xl mb-3" style={{ color: 'var(--c-navy, #015376)' }}>
          Submission Complete
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--c-muted, #4A5568)' }}>
          Your data has been submitted and your SDG scores have been recalculated for {PERIOD}.
        </p>

        <div className="rounded-xl border p-8 mb-8"
          style={{ background: 'var(--c-card, #fff)', border: '1px solid var(--c-border, #DDE3EC)' }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted, #4A5568)' }}>
            Your Updated Overall Score
          </p>
          <p className="font-bold text-6xl mb-2" style={{ color: sc }}>
            {newScore.score.toFixed(1)}
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--c-muted, #4A5568)' }}>out of 3.0 maximum</p>
          <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full"
            style={{ background: classBg, color: classTx }}>
            {newScore.classification} Impact
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => router.push('/scorecard')}
            className="w-full h-12 rounded-lg text-white font-semibold text-sm transition"
            style={{ background: 'var(--sanlam-teal, #00B5ED)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0099CC'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--sanlam-teal, #00B5ED)'}>
            View My Updated Scorecard
          </button>
          <button onClick={() => router.push('/coach')}
            className="w-full h-12 rounded-lg font-semibold text-sm transition"
            style={{ border: '1px solid var(--sanlam-teal, #00B5ED)', color: 'var(--sanlam-teal, #00B5ED)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--c-teal-tint, #C9EEFB)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            Talk to AI Coach
          </button>
          <button onClick={() => router.push('/dashboard')}
            className="text-sm transition"
            style={{ color: 'var(--c-muted, #4A5568)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-navy, #015376)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--c-muted, #4A5568)'}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-page-in">

      {/* Progress card */}
      <div className="rounded-xl p-5"
        style={{ background: 'var(--c-card, #fff)', border: '1px solid var(--c-border, #DDE3EC)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm" style={{ color: 'var(--c-navy, #015376)' }}>
            Step {step + 1} of {totalSteps}: {currentCategory.label}
          </p>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--c-muted, #4A5568)' }}>
                <Save size={11} /> Saving...
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--c-muted, #4A5568)' }}>
              {Math.round((step / totalSteps) * 100)}% complete
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {FORM_CATEGORIES.map((cat, i) => (
            <button key={cat.id} onClick={() => i < step && setStep(i)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i < step ? 'var(--sanlam-teal, #00B5ED)' : i === step ? 'var(--c-sidebar, #015376)' : 'var(--c-border, #DDE3EC)',
                cursor: i < step ? 'pointer' : 'default',
              }}
            />
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {FORM_CATEGORIES.map((cat, i) => (
            <span key={cat.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: i === step ? 'var(--c-sidebar, #015376)' : i < step ? 'var(--c-teal-tint, #C9EEFB)' : 'var(--c-bg, #F4F6F8)',
                color:      i === step ? 'white' : i < step ? 'var(--sanlam-teal, #00B5ED)' : 'var(--c-muted, #4A5568)',
              }}>
              {cat.icon} {cat.label}
            </span>
          ))}
        </div>
      </div>

      {/* KPI form card */}
      <div className="rounded-xl p-6"
        style={{ background: 'var(--c-card, #fff)', border: '1px solid var(--c-border, #DDE3EC)' }}>

        {/* Category header */}
        <div className="flex items-start gap-3 mb-6 pb-5"
          style={{ borderBottom: '1px solid var(--c-border, #DDE3EC)' }}>
          <span className="text-3xl">{currentCategory.icon}</span>
          <div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--c-navy, #015376)' }}>
              {currentCategory.label}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted, #4A5568)' }}>
              {currentCategory.description}
            </p>
            <div className="flex gap-1.5 mt-2">
              {currentCategory.sdgs.map(sdgId => (
                <span key={sdgId} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ border: '1px solid var(--c-border, #DDE3EC)', color: 'var(--c-muted, #4A5568)' }}>
                  SDG {sdgId}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fields */}
        {currentCategory.kpis.map(kpi => (
          <KPIField
            key={kpi.id}
            kpi={kpi}
            value={values[kpi.id] || ''}
            onChange={handleChange}
            error={errors[kpi.id]}
          />
        ))}

        <p className="text-xs mt-2 mb-0" style={{ color: 'var(--c-faint, rgba(74,85,104,0.6))' }}>
          Fields marked with * are required. All others are optional but improve your score accuracy.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pb-8">
        <button onClick={handleBack} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            border:   '1px solid var(--c-border, #DDE3EC)',
            color:    'var(--c-muted, #4A5568)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            if (step > 0) {
              (e.currentTarget as HTMLElement).style.color = 'var(--c-navy, #015376)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-navy, #015376)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--c-muted, #4A5568)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border, #DDE3EC)';
          }}>
          <ChevronLeft size={16} /> Previous
        </button>

        {step < totalSteps - 1 ? (
          <button onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition"
            style={{ background: 'var(--sanlam-teal, #00B5ED)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0099CC'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--sanlam-teal, #00B5ED)'}>
            Save & Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: '#00A651' }}
            onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#008A44'; }}
            onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLElement).style.background = '#00A651'; }}>
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calculating scores...</>
            ) : (
              <><Send size={15} /> Submit & Calculate Scores</>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
