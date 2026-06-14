'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, TrendingUp } from 'lucide-react';

interface Props {
  currentClassification:  string;
  previousClassification: string | null;
  currentScore:           number;
  companyName:            string;
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id:    i,
    left:  `${(i * 2.5) % 100}%`,
    delay: `${(i * 0.04) % 0.5}s`,
    color: ['#00B5ED', '#00A651', '#E8A020', '#FCC30B', '#DD1367', '#00689D'][i % 6],
    size:  `${4 + (i % 6)}px`,
    round: i % 2 === 0,
    speed: 1.5 + (i % 10) * 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 200 }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:    'fixed',
          left:         p.left,
          top:         '-10px',
          width:        p.size,
          height:       p.size,
          background:   p.color,
          borderRadius: p.round ? '50%' : '2px',
          animation:   `confettiFall ${p.speed}s ease-in ${p.delay} forwards`,
        }} />
      ))}
    </div>
  );
}

const MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  Low_Medium: {
    emoji: '⭐',
    title: 'You reached Medium Impact!',
    body:  'Your SDG score has moved out of Low Impact. This is a significant milestone — your quarterly submissions and improvement work are paying off.',
  },
  Medium_High: {
    emoji: '🏆',
    title: 'You reached High Impact!',
    body:  'Outstanding. Your SDG score is now in the High Impact range — the top classification in the 104+ portfolio. Sanlam Investments recognises this achievement.',
  },
};

export default function ClassificationCelebration({
  currentClassification,
  previousClassification,
  currentScore,
  companyName,
}: Props) {
  const router             = useRouter();
  const [show,     setShow]     = useState(false);
  const [confetti, setConfetti] = useState(false);

  const key = `${previousClassification}_${currentClassification}`;
  const msg = MESSAGES[key];

  useEffect(() => {
    if (!msg || !previousClassification) return;

    const seenKey = `celebration_seen_${currentClassification}_${currentScore.toFixed(1)}`;
    try {
      if (localStorage.getItem(seenKey)) return;
      localStorage.setItem(seenKey, 'true');
    } catch {}

    const t1 = setTimeout(() => { setConfetti(true); setShow(true); }, 800);
    const t2 = setTimeout(() => setConfetti(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [currentClassification, previousClassification, currentScore, msg]);

  if (!show || !msg) return null;

  const isHigh    = currentClassification === 'High';
  const accentColor = isHigh ? '#00A651' : '#E8A020';

  return (
    <>
      {confetti && <Confetti />}

      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShow(false)} />

      <div className="fixed top-1/2 left-1/2 z-50"
        style={{
          transform: 'translate(-50%, -50%)',
          width:     '100%',
          maxWidth:  '380px',
          padding:   '0 16px',
          animation: 'celebBounceIn 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
        <style>{`
          @keyframes celebBounceIn {
            0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
            60%  { transform: translate(-50%, -50%) scale(1.05); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        <div style={{
          background:   'var(--surface)',
          borderRadius: '20px',
          overflow:     'hidden',
          border:       '1px solid var(--border)',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.25)',
        }}>
          {/* Top colour band */}
          <div style={{
            height:     '6px',
            background: isHigh
              ? 'linear-gradient(90deg, #00A651, #00B5ED)'
              : 'linear-gradient(90deg, #E8A020, #00B5ED)',
          }} />

          <div style={{ padding: '28px 24px 24px', position: 'relative' }}>
            <button onClick={() => setShow(false)}
              className="absolute top-4 right-4"
              style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>

            <div className="text-5xl text-center mb-4" style={{ lineHeight: 1 }}>
              {msg.emoji}
            </div>

            <h2 className="font-bold text-xl text-center mb-2" style={{ color: 'var(--text-primary)' }}>
              {msg.title}
            </h2>

            <p className="text-sm text-center mb-3" style={{ color: 'var(--sanlam-teal)', fontWeight: 600 }}>
              {companyName}
            </p>

            <div className="flex justify-center mb-4">
              <div className="px-5 py-2 rounded-full"
                style={{
                  background: `${accentColor}1A`,
                  border:     `1px solid ${accentColor}4D`,
                }}>
                <span className="font-bold text-2xl" style={{ color: accentColor }}>
                  {currentScore.toFixed(1)}
                </span>
                <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                  {currentClassification} Impact
                </span>
              </div>
            </div>

            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
              {msg.body}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setShow(false); router.push('/history'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: 'rgba(0,181,237,0.1)',
                  color:      'var(--sanlam-teal)',
                  border:     '1px solid rgba(0,181,237,0.2)',
                }}>
                <TrendingUp size={14} />
                View history
              </button>
              <button
                onClick={() => setShow(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                style={{ background: accentColor }}>
                Continue
              </button>
            </div>
          </div>

          <div className="px-6 py-3 text-center"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              INvestScore · Sanlam Investments · 104+ SMME Portfolio
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
