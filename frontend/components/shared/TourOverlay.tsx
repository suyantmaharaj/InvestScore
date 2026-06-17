'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTour } from '@/contexts/TourContext';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const PORTAL_COLORS = {
  sme:   { bg: '#00B5ED', label: 'SME Portal'   },
  pm:    { bg: '#00A651', label: 'PM Portal'     },
  admin: { bg: '#E8A020', label: 'Admin Portal'  },
};

interface Rect { top: number; left: number; width: number; height: number }
const EMPTY_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };
const PAD = 8;

export default function TourOverlay() {
  const {
    active, stepIndex, currentStep,
    nextStep, prevStep, endTour, totalSteps,
  } = useTour();

  const [rect,    setRect]    = useState<Rect>(EMPTY_RECT);
  const [visible, setVisible] = useState(false);

  const measureTarget = useCallback(() => {
    if (!currentStep) return;

    const el = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (!el) {
      setTimeout(measureTarget, 200);
      return;
    }

    // Scroll into view first, then re-measure after scroll settles
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setVisible(true);
    }, 300);
  }, [currentStep]);

  useEffect(() => {
    if (!active || !currentStep) { setVisible(false); return; }
    setVisible(false);
    const t = setTimeout(measureTarget, currentStep.waitMs ?? 400);
    return () => clearTimeout(t);
  }, [active, currentStep, measureTarget]);

  if (!active || !currentStep) return null;

  const sr = {
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  };

  const portalCfg = PORTAL_COLORS[currentStep.portal ?? 'sme'];
  const progress  = ((stepIndex + 1) / totalSteps) * 100;
  const isLast    = stepIndex === totalSteps - 1;

  return (
    <div
      style={{
        position:      'fixed',
        inset:          0,
        zIndex:         9998,
        pointerEvents: visible ? 'all' : 'none',
        opacity:        visible ? 1 : 0,
        transition:    'opacity 300ms ease',
      }}
    >
      {/* 4-panel dark overlay framing the spotlight */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${sr.top}px`, background: 'rgba(1,30,48,0.88)', pointerEvents: 'none', transition: 'height 350ms cubic-bezier(0.16,1,0.3,1)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: `${sr.top + sr.height}px`, background: 'rgba(1,30,48,0.88)', pointerEvents: 'none', transition: 'top 350ms cubic-bezier(0.16,1,0.3,1)' }} />
      <div style={{ position: 'absolute', top: `${sr.top}px`, left: 0, width: `${sr.left}px`, height: `${sr.height}px`, background: 'rgba(1,30,48,0.88)', pointerEvents: 'none', transition: 'all 350ms cubic-bezier(0.16,1,0.3,1)' }} />
      <div style={{ position: 'absolute', top: `${sr.top}px`, left: `${sr.left + sr.width}px`, right: 0, height: `${sr.height}px`, background: 'rgba(1,30,48,0.88)', pointerEvents: 'none', transition: 'all 350ms cubic-bezier(0.16,1,0.3,1)' }} />

      {/* Teal pulsing ring around spotlight */}
      <div style={{
        position:     'absolute',
        top:          `${sr.top}px`,
        left:         `${sr.left}px`,
        width:        `${sr.width}px`,
        height:       `${sr.height}px`,
        borderRadius: '10px',
        boxShadow:    `0 0 0 2.5px #00B5ED, 0 0 0 5px rgba(0,181,237,0.2)`,
        pointerEvents: 'none',
        transition:   'all 350ms cubic-bezier(0.16,1,0.3,1)',
        animation:    'tourPulse 2s ease-in-out infinite',
      }} />

      {/* Tooltip label attached near the element */}
      <TooltipBubble step={currentStep} rect={sr} color={portalCfg.bg} />

      {/* Floating panel — bottom right */}
      <div style={{
        position:     'fixed',
        bottom:        '24px',
        right:         '24px',
        width:         '320px',
        background:    '#011e30',
        border:        '1px solid rgba(255,255,255,0.1)',
        borderRadius:  '16px',
        overflow:      'hidden',
        boxShadow:     '0 24px 48px rgba(0,0,0,0.4)',
        zIndex:         9999,
      }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: portalCfg.bg, transition: 'width 350ms ease' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: `${portalCfg.bg}22`, color: portalCfg.bg }}>
            {portalCfg.label}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
            {stepIndex + 1} / {totalSteps}
          </span>
          <button
            onClick={endTour}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
            title="End tour (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '6px', lineHeight: '1.4' }}>
            {currentStep.title}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '14px' }}>
            {currentStep.description}
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {stepIndex > 0 && (
              <button
                onClick={prevStep}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <ArrowLeft size={13} /> Back
              </button>
            )}
            <button
              onClick={isLast ? endTour : nextStep}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: 'none', background: portalCfg.bg, color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {isLast ? 'Explore the platform' : 'Next'}
              {!isLast && <ArrowRight size={13} />}
            </button>
          </div>

          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '8px' }}>
            ← → arrow keys · Esc to exit
          </p>
        </div>
      </div>

      <style>{`
        @keyframes tourPulse {
          0%, 100% { box-shadow: 0 0 0 2.5px #00B5ED, 0 0 0 5px rgba(0,181,237,0.2); }
          50%       { box-shadow: 0 0 0 2.5px #00B5ED, 0 0 0 10px rgba(0,181,237,0.06); }
        }
      `}</style>
    </div>
  );
}

function TooltipBubble({ step, rect, color }: { step: TourStep; rect: Rect; color: string }) {
  const ARROW = 8;
  const OFF   = 12;

  const midX = rect.left + rect.width  / 2;
  const midY = rect.top  + rect.height / 2;

  let style: React.CSSProperties = { position: 'absolute', zIndex: 9999, pointerEvents: 'none' };
  let arrowStyle: React.CSSProperties = { position: 'absolute', width: 0, height: 0 };

  switch (step.position) {
    case 'bottom':
      style = { ...style, top: `${rect.top + rect.height + ARROW + OFF}px`, left: `${midX}px`, transform: 'translateX(-50%)' };
      arrowStyle = { ...arrowStyle, top: `-${ARROW}px`, left: '50%', transform: 'translateX(-50%)', borderBottom: `${ARROW}px solid ${color}`, borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent` };
      break;
    case 'top':
      style = { ...style, top: `${rect.top - ARROW - OFF - 36}px`, left: `${midX}px`, transform: 'translateX(-50%)' };
      arrowStyle = { ...arrowStyle, bottom: `-${ARROW}px`, left: '50%', transform: 'translateX(-50%)', borderTop: `${ARROW}px solid ${color}`, borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent` };
      break;
    case 'right':
      style = { ...style, top: `${midY}px`, left: `${rect.left + rect.width + ARROW + OFF}px`, transform: 'translateY(-50%)' };
      arrowStyle = { ...arrowStyle, top: '50%', left: `-${ARROW}px`, transform: 'translateY(-50%)', borderRight: `${ARROW}px solid ${color}`, borderTop: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid transparent` };
      break;
    case 'left':
      style = { ...style, top: `${midY}px`, right: `calc(100vw - ${rect.left}px + ${ARROW + OFF}px)`, transform: 'translateY(-50%)' };
      arrowStyle = { ...arrowStyle, top: '50%', right: `-${ARROW}px`, transform: 'translateY(-50%)', borderLeft: `${ARROW}px solid ${color}`, borderTop: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid transparent` };
      break;
    default:
      return null;
  }

  return (
    <div style={{
      ...style,
      background:   color,
      borderRadius: '8px',
      padding:      '5px 12px',
      maxWidth:     '220px',
      fontSize:     '11px',
      fontWeight:    600,
      color:        'white',
      lineHeight:   '1.4',
      whiteSpace:   'nowrap',
    }}>
      <div style={arrowStyle} />
      {step.title}
    </div>
  );
}
