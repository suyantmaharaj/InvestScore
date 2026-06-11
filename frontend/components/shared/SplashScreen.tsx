'use client';

import { useEffect, useState } from 'react';

type Phase = 'idle' | 'invest-in' | 'score-in' | 'branding-in' | 'out';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase('invest-in'),   180));
    t.push(setTimeout(() => setPhase('score-in'),    900));
    t.push(setTimeout(() => setPhase('branding-in'), 1900));
    t.push(setTimeout(() => setPhase('out'),         3800));
    t.push(setTimeout(() => onComplete(),            4500));
    return () => t.forEach(clearTimeout);
  }, [onComplete]);

  const investVisible   = phase !== 'idle';
  const scoreVisible    = ['score-in', 'branding-in', 'out'].includes(phase);
  const subtitleVisible = scoreVisible;
  const brandingVisible = ['branding-in', 'out'].includes(phase);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        overflow:       'hidden',
        fontFamily:     "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background:     'radial-gradient(ellipse 120% 110% at 50% 44%, #01688f 0%, #014e6c 42%, #011d32 100%)',
        opacity:        phase === 'out' ? 0 : 1,
        transition:     phase === 'out' ? 'opacity 700ms cubic-bezier(0.55, 0, 1, 0.45)' : 'none',
        pointerEvents:  phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* Decorative rings */}
      {([480, 740, 1040] as const).map((size, i) => (
        <div
          key={size}
          style={{
            position:      'absolute',
            pointerEvents: 'none',
            borderRadius:  '50%',
            width:         size,
            height:        size,
            border:        `1px solid rgba(255,255,255,${(0.055 - i * 0.014).toFixed(3)})`,
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%, -50%)',
          }}
        />
      ))}
      <div style={{
        position: 'absolute', pointerEvents: 'none', borderRadius: '50%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,181,237,0.08) 0%, transparent 65%)',
        top: '10%', right: '8%',
      }} />
      <div style={{
        position: 'absolute', pointerEvents: 'none', borderRadius: '50%',
        width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(0,181,237,0.04) 0%, transparent 65%)',
        bottom: '14%', left: '6%',
      }} />

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', userSelect: 'none' }}>
        <span style={{
          fontSize:      74,
          fontWeight:    700,
          color:         'white',
          letterSpacing: '-0.03em',
          lineHeight:    1,
          opacity:       investVisible ? 1 : 0,
          transform:     investVisible ? 'translateY(0)' : 'translateY(10px)',
          transition:    'opacity 520ms cubic-bezier(0.23,1,0.32,1), transform 520ms cubic-bezier(0.23,1,0.32,1)',
        }}>
          Invest
        </span>
        <span style={{
          fontSize:      74,
          fontWeight:    700,
          color:         '#00B5ED',
          letterSpacing: '-0.03em',
          lineHeight:    1,
          opacity:       scoreVisible ? 1 : 0,
          transform:     scoreVisible ? 'translateX(0)' : 'translateX(-8px)',
          transition:    'opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 400ms cubic-bezier(0.23,1,0.32,1)',
        }}>
          Score
        </span>
      </div>

      {/* Subtitle */}
      <p style={{
        margin:        '14px 0 0',
        color:         'rgba(255,255,255,0.2)',
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: '0.22em',
        opacity:       subtitleVisible ? 1 : 0,
        transition:    'opacity 500ms ease 300ms',
      }}>
        SDG IMPACT PLATFORM
      </p>

      {/* Expanding divider */}
      <div style={{
        width:        brandingVisible ? 200 : 0,
        height:       1,
        marginTop:    38,
        marginBottom: 22,
        background:   'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
        transition:   'width 650ms cubic-bezier(0.23,1,0.32,1) 60ms',
      }} />

      {/* Branding */}
      <div style={{
        textAlign:  'center',
        opacity:    brandingVisible ? 1 : 0,
        transform:  brandingVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 520ms cubic-bezier(0.23,1,0.32,1), transform 520ms cubic-bezier(0.23,1,0.32,1)',
      }}>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em' }}>
          POWERED BY
        </p>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.76)', fontSize: 15, fontWeight: 500, letterSpacing: '0.01em' }}>
          Sanlam Investments
        </p>
      </div>

      <p style={{
        margin:        '10px 0 0',
        color:         'rgba(0,181,237,0.5)',
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: '0.14em',
        opacity:       brandingVisible ? 1 : 0,
        transition:    'opacity 520ms ease 220ms',
      }}>
        TWIN TRANSITION CHALLENGE 2026
      </p>
    </div>
  );
}
