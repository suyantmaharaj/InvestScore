'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Eye, EyeOff, CheckCircle, X } from 'lucide-react';

const DEMO_PASSCODE = 'INVEST2026';

export default function RegisterPage() {
  const router = useRouter();

  const [step,      setStep]      = useState<1 | 2>(1);
  const [submitted, setSubmitted] = useState(false);

  // Step 1
  const [passcode,      setPasscode]      = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Step 2
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry,    setIndustry]    = useState('');
  const [description, setDescription] = useState('');
  const [formError,   setFormError]   = useState('');
  const [busy,        setBusy]        = useState(false);

  const handlePasscode = () => {
    if (passcode.toUpperCase() !== DEMO_PASSCODE) {
      setPasscodeError('Invalid passcode. Contact your Portfolio Manager.');
      return;
    }
    setPasscodeError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!name || !email || !password || !companyName || !industry || !description) {
      setFormError('Please complete all fields.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, companyName, industry, description }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed.';
      setFormError(msg === 'Failed' ? 'Submission failed. Please try again.' : msg);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full h-11 px-3 rounded-lg border border-[#DDE3EC] bg-white text-[#015376] placeholder:text-[#4A5568]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition';

  const labelClass = 'block text-sm font-medium text-[#015376] mb-1.5';

  // SUCCESS STATE
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#DDE3EC] p-10 w-full max-w-md text-center">
          <CheckCircle size={48} className="text-[#00A651] mx-auto mb-5" />
          <h2 className="text-[#015376] font-semibold text-2xl mb-3">Request submitted</h2>
          <p className="text-[#4A5568] text-sm mb-8">
            Your registration has been submitted to Sanlam Investments for review.
            You will receive an email once your account has been approved.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full h-12 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] transition"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-[#DDE3EC] p-8 w-full max-w-md">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => step === 1 ? router.push('/login') : setStep(1)}
            className="flex items-center gap-1 text-[#4A5568] text-sm hover:text-[#015376] transition"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          {step === 2 && (
            <span className="bg-[#00B5ED] text-white text-xs font-medium px-3 py-1 rounded-full">
              Step 2 of 2
            </span>
          )}
        </div>

        {/* STEP 1 — Passcode */}
        {step === 1 && (
          <>
            <h2 className="text-[#015376] font-semibold text-2xl mb-1">
              Register your company
            </h2>
            <p className="text-[#4A5568] text-sm mb-8">
              Enter your Sanlam access passcode to continue
            </p>

            {passcodeError && (
              <div className="flex items-start justify-between gap-3 bg-red-50 border border-[#D0021B] rounded-md p-3 mb-5">
                <p className="text-red-800 text-sm">{passcodeError}</p>
                <button
                  onClick={() => setPasscodeError('')}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="mb-2">
              <input
                type="text"
                value={passcode}
                onChange={e => setPasscode(e.target.value.toUpperCase().slice(0, 12))}
                onKeyDown={e => e.key === 'Enter' && handlePasscode()}
                placeholder="XXXXXX"
                maxLength={12}
                className="w-full h-14 px-4 rounded-lg border border-[#DDE3EC] bg-white text-[#015376] text-center text-xl font-semibold tracking-[0.4em] placeholder:tracking-normal placeholder:text-[#4A5568]/40 placeholder:text-base placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition"
              />
            </div>
            <p className="text-[#4A5568]/60 text-xs text-center mb-8">
              Passcode provided by your Sanlam Portfolio Manager
            </p>

            <button
              onClick={handlePasscode}
              className="w-full h-12 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] transition"
            >
              Continue
            </button>
          </>
        )}

        {/* STEP 2 — Registration form */}
        {step === 2 && (
          <>
            <h2 className="text-[#015376] font-semibold text-2xl mb-1">
              Tell us about your company
            </h2>
            <p className="text-[#4A5568] text-sm mb-6">
              Your details will be reviewed by Sanlam before access is granted
            </p>

            {formError && (
              <div className="flex items-start justify-between gap-3 bg-red-50 border border-[#D0021B] rounded-md p-3 mb-5">
                <p className="text-red-800 text-sm">{formError}</p>
                <button
                  onClick={() => setFormError('')}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Your full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sipho Nkosi"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sipho@company.co.za"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#015376] transition"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[#4A5568]/60 text-xs mt-1">Min. 8 characters</p>
              </div>
              <div>
                <label className={labelClass}>Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Khaya Capital (Pty) Ltd"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Industry / Sector</label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. Manufacturing, ICT, Retail"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Brief company description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does your company do?"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#DDE3EC] bg-white text-[#015376] placeholder:text-[#4A5568]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5ED] focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full h-12 rounded-lg bg-[#00B5ED] text-white font-semibold text-sm hover:bg-[#0099CC] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : 'Submit registration request'}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
