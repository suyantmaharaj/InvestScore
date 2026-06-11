'use client';

import { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<
    'idle' | 'invest-in' | 'swoop' | 'morph' | 'score-in' | 'settle' | 'sanlam-in' | 'out'
  >('idle');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('invest-in'),  200));
    timers.push(setTimeout(() => setPhase('swoop'),       900));
    timers.push(setTimeout(() => setPhase('morph'),      2000));
    timers.push(setTimeout(() => setPhase('score-in'),   2400));
    timers.push(setTimeout(() => setPhase('settle'),     3200));
    timers.push(setTimeout(() => setPhase('sanlam-in'),  3800));
    timers.push(setTimeout(() => setPhase('out'),        5200));
    timers.push(setTimeout(() => onComplete(),           5900));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     '#015376',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        opacity:        phase === 'out' ? 0 : 1,
        transition:     phase === 'out' ? 'opacity 700ms ease-in' : 'none',
        pointerEvents:  phase === 'out' ? 'none' : 'all',
      }}
    >
      <div style={{ position: 'relative', width: '420px', height: '120px' }}>
        <AnimatedLogo phase={phase} />
      </div>

      {/* Sanlam branding */}
      <div
        style={{
          marginTop:  '32px',
          opacity:    phase === 'sanlam-in' || phase === 'out' ? 1 : 0,
          transform:  phase === 'sanlam-in' || phase === 'out' ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 600ms ease, transform 600ms ease',
          textAlign:  'center',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', letterSpacing: '0.08em', margin: 0 }}>
          POWERED BY
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500, margin: '4px 0 0', letterSpacing: '0.04em' }}>
          Sanlam Investments
        </p>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop:  '12px',
          opacity:    phase === 'sanlam-in' || phase === 'out' ? 1 : 0,
          transition: 'opacity 600ms ease 200ms',
        }}
      >
        <p style={{ color: 'rgba(0,181,237,0.6)', fontSize: '11px', letterSpacing: '0.12em', margin: 0 }}>
          TWIN TRANSITION CHALLENGE 2026
        </p>
      </div>
    </div>
  );
}

// ── ANIMATED LOGO SVG ──────────────────────────────────────────────────────────
function AnimatedLogo({ phase }: { phase: string }) {
  const investVisible = ['invest-in','swoop','morph','score-in','settle','sanlam-in','out'].includes(phase);
  const swooping      = phase === 'swoop';
  const morphing      = phase === 'morph';
  const scoreVisible  = ['score-in','settle','sanlam-in','out'].includes(phase);
  const handleFading  = ['settle','sanlam-in','out'].includes(phase);

  return (
    <svg
      viewBox="0 0 420 120"
      width="420"
      height="120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <style>{`
          @keyframes investFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0);   }
          }
          @keyframes swoop {
            0%   { transform: translateX(-140px) translateY(10px) rotate(-15deg); opacity: 0; }
            15%  { opacity: 1; }
            100% { transform: translateX(0px) translateY(0px) rotate(0deg); opacity: 1; }
          }
          @keyframes lensToO {
            0%   { r: 22; opacity: 1; }
            40%  { r: 19; }
            100% { r: 19; opacity: 0; }
          }
          @keyframes scoreLetters {
            from { opacity: 0; letter-spacing: 0.3em; }
            to   { opacity: 1; letter-spacing: -0.02em; }
          }
          @keyframes pulse-ring {
            0%   { r: 22; opacity: 0.6; }
            100% { r: 38; opacity: 0;   }
          }
          .invest-text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 72px;
            font-weight: 700;
            fill: white;
            letter-spacing: -0.02em;
          }
          .score-text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 72px;
            font-weight: 700;
            fill: #00B5ED;
            letter-spacing: -0.02em;
          }
        `}</style>
      </defs>

      {/* "Invest" text */}
      <text
        x="14"
        y="88"
        className="invest-text"
        style={{
          opacity:   investVisible ? 1 : 0,
          animation: investVisible ? 'investFadeIn 600ms ease forwards' : 'none',
        }}
      >
        Invest
      </text>

      {/* Magnifying glass group */}
      <g
        style={{
          transformOrigin: '252px 62px',
          animation: swooping
            ? 'swoop 1100ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
            : undefined,
          opacity: (swooping || morphing) ? 1 : phase === 'invest-in' ? 0 : undefined,
        }}
      >
        {/* Pulse ring — emits on morph */}
        {morphing && (
          <circle
            cx="252"
            cy="62"
            r="22"
            fill="none"
            stroke="#00B5ED"
            strokeWidth="2"
            style={{ animation: 'pulse-ring 500ms ease-out forwards' }}
          />
        )}

        {/* Lens circle */}
        <circle
          cx="252"
          cy="62"
          r="22"
          fill="none"
          stroke="white"
          strokeWidth="5"
          style={{
            animation: morphing ? 'lensToO 400ms ease forwards' : undefined,
            opacity:   scoreVisible && !swooping && !morphing ? 0 : undefined,
          }}
        />

        {/* Handle */}
        <line
          x1="268"
          y1="78"
          x2="296"
          y2="106"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          style={{
            opacity:    handleFading ? 0 : 1,
            transition: handleFading ? 'opacity 400ms ease' : 'none',
          }}
        />
      </g>

      {/* "S" */}
      <text
        x="213"
        y="88"
        className="score-text"
        style={{
          opacity:   scoreVisible ? 1 : 0,
          animation: scoreVisible ? 'scoreLetters 400ms ease forwards' : 'none',
        }}
      >
        S
      </text>

      {/* "o" — appears at lens position */}
      <text
        x="249"
        y="88"
        className="score-text"
        style={{
          opacity:    scoreVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
        o
      </text>

      {/* "re" */}
      <text
        x="288"
        y="88"
        className="score-text"
        style={{
          opacity:   scoreVisible ? 1 : 0,
          animation: scoreVisible ? 'scoreLetters 500ms ease 100ms forwards' : 'none',
        }}
      >
        re
      </text>

      {/* Teal accent dot */}
      <circle
        cx="408"
        cy="30"
        r="5"
        fill="#00B5ED"
        style={{
          opacity:    scoreVisible ? 0.6 : 0,
          transition: 'opacity 400ms ease 300ms',
        }}
      />
    </svg>
  );
}
