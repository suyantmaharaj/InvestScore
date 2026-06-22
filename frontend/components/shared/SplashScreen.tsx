'use client';

import { useRef, useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const splashRef      = useRef<HTMLElement>(null);
  const stageRef       = useRef<HTMLDivElement>(null);
  const wordmarkRef    = useRef<HTMLHeadingElement>(null);
  const ghostORef      = useRef<HTMLSpanElement>(null);
  const lensRef        = useRef<HTMLDivElement>(null);
  const emblemBloomRef = useRef<HTMLDivElement>(null);
  const partnerRef     = useRef<HTMLDivElement>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const splash      = splashRef.current;
    const stage       = stageRef.current;
    const wordmark    = wordmarkRef.current;
    const ghostO      = ghostORef.current;
    const lens        = lensRef.current;
    const bloom       = emblemBloomRef.current;
    const partner     = partnerRef.current;
    const waterCanvas = waterCanvasRef.current;
    if (!splash || !stage || !wordmark || !ghostO || !lens) return;

    const letters = Array.from(wordmark.querySelectorAll<HTMLElement>('.sp-letter'));
    let destroyed = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delay = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { if (!destroyed) fn(); }, ms);
      timers.push(id);
    };

    // --- Ripple engine ---
    let rippleRings: { x: number; y: number; start: number; duration: number; maxR: number }[] = [];
    let rippleRunning = true;
    let rippleRafId: number | null = null;
    let rippleCtx: CanvasRenderingContext2D | null = null;
    let rippleW = window.innerWidth;
    let rippleH = window.innerHeight;
    let rippleDpr = window.devicePixelRatio || 1;

    const rippleDrop = (x: number, y: number, strength = 1) => {
      rippleRings.push({ x, y, start: performance.now(), duration: 1200, maxR: Math.max(rippleW, rippleH) * 0.6 * strength });
    };

    if (waterCanvas) {
      rippleCtx = waterCanvas.getContext('2d');
      const resizeRipple = () => {
        rippleW = window.innerWidth; rippleH = window.innerHeight; rippleDpr = window.devicePixelRatio || 1;
        waterCanvas.width  = Math.round(rippleW * rippleDpr);
        waterCanvas.height = Math.round(rippleH * rippleDpr);
        waterCanvas.style.width  = rippleW + 'px';
        waterCanvas.style.height = rippleH + 'px';
        rippleCtx?.setTransform(rippleDpr, 0, 0, rippleDpr, 0, 0);
      };
      resizeRipple();
      const pointerHandler = (e: PointerEvent) => rippleDrop(e.clientX, e.clientY);
      window.addEventListener('resize', resizeRipple);
      window.addEventListener('pointerdown', pointerHandler);
      const rippleLoop = () => {
        if (!rippleRunning || !rippleCtx) return;
        const now = performance.now();
        rippleRings = rippleRings.filter(r => (now - r.start) < r.duration);
        rippleCtx.clearRect(0, 0, rippleW, rippleH);
        rippleCtx.save();
        for (const r of rippleRings) {
          const t = (now - r.start) / r.duration;
          if (t >= 1) continue;
          rippleCtx.beginPath();
          rippleCtx.arc(r.x, r.y, r.maxR * t, 0, Math.PI * 2);
          rippleCtx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.16 * (1 - t))})`;
          rippleCtx.lineWidth = 2;
          rippleCtx.stroke();
        }
        rippleCtx.restore();
        rippleRafId = requestAnimationFrame(rippleLoop);
      };
      rippleRafId = requestAnimationFrame(rippleLoop);
    }

    // --- Easing ---
    const easeOutExpo    = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function getTargetOffset() {
      const sr = stage.getBoundingClientRect();
      const or = ghostO.getBoundingClientRect();
      return {
        x: (or.left + or.right)  / 2 - (sr.left + sr.right)  / 2,
        y: (or.top  + or.bottom) / 2 - (sr.top  + sr.bottom) / 2,
      };
    }

    function animateLens({
      from, to, duration, ease, onUpdate, onComplete: done,
    }: {
      from: { x: number; y: number; scale: number };
      to:   { x: number; y: number; scale: number };
      duration: number;
      ease: (t: number) => number;
      onUpdate?: (s: { t: number; x: number; y: number; scale: number }) => void;
      onComplete?: () => void;
    }) {
      if (destroyed) return;
      const start = performance.now();
      const frame = (now: number) => {
        if (destroyed) return;
        const t     = Math.min((now - start) / duration, 1);
        const eased = ease(t);
        const x     = from.x + (to.x - from.x) * eased;
        const y     = from.y + (to.y - from.y) * eased;
        const scale = from.scale + (to.scale - from.scale) * eased;
        lens.style.setProperty('--lx',     `${x}px`);
        lens.style.setProperty('--ly',     `${y}px`);
        lens.style.setProperty('--lscale', String(scale));
        onUpdate?.({ t, x, y, scale });
        if (t < 1) requestAnimationFrame(frame);
        else done?.();
      };
      requestAnimationFrame(frame);
    }

    function updateLetterMagnify(state: { t: number; x: number; y: number; scale: number }) {
      try {
        const sr  = stage.getBoundingClientRect();
        const lcx = sr.left + sr.width  / 2 + state.x;
        const lcy = sr.top  + sr.height / 2 + state.y;
        const radius = 120 + 40 * state.scale;
        letters.forEach(letter => {
          if (letter.classList.contains('sp-letter--ghost')) return;
          const r    = letter.getBoundingClientRect();
          const cx   = (r.left + r.right)  / 2;
          const cy   = (r.top  + r.bottom) / 2;
          const dist = Math.sqrt((cx - lcx) ** 2 + (cy - lcy) ** 2);
          if (dist < radius) {
            const pct  = 1 - dist / radius;
            letter.classList.add('sp-lens-revealed');
            const lr   = lens.getBoundingClientRect();
            const base = Math.max(lr.width, lr.height) || 56;
            const ir   = base * 0.46 * state.scale;
            const s    = dist < ir ? 1 + 0.28 * pct * state.scale : 1 + 0.12 * pct * state.scale;
            const br   = dist < ir ? 1 + 0.28 * pct : 1 + 0.18 * pct;
            letter.style.transform = `translate3d(0,0,0) scale3d(${s},${s},1)`;
            letter.style.filter    = `brightness(${br}) drop-shadow(0 6px 14px rgba(0,0,0,${0.35 * pct}))`;
          } else {
            letter.style.transform = '';
            letter.style.filter    = '';
          }
        });
      } catch (_) {}
    }

    function resizeLensToO() {
      const or = ghostO.getBoundingClientRect();
      if (!or.width) return;
      const size = Math.max(or.width, or.height) * 0.55;
      lens.style.width  = `${size}px`;
      lens.style.height = `${size}px`;
    }
    resizeLensToO();
    window.addEventListener('resize', resizeLensToO);

    function moveLens(
      from: { x: number; y: number; scale: number },
      to:   { x: number; y: number; scale: number },
      duration: number,
      ease: (t: number) => number,
    ) {
      return new Promise<void>(resolve =>
        animateLens({ from, to, duration, ease, onUpdate: updateLetterMagnify, onComplete: resolve }),
      );
    }

    function getLetterOffset(idx: number) {
      const el = letters[idx];
      if (!el) return { x: 0, y: 0 };
      const sr = stage.getBoundingClientRect();
      const r  = el.getBoundingClientRect();
      return {
        x: (r.left + r.right)  / 2 - (sr.left + sr.right)  / 2,
        y: (r.top  + r.bottom) / 2 - (sr.top  + sr.bottom) / 2,
      };
    }

    function goToLogin() {
      splash.classList.add('sp-splash--fading');
      delay(onComplete, 850);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      letters.forEach(l => { if (!l.classList.contains('sp-letter--ghost')) l.classList.add('sp-lens-revealed'); });
      delay(goToLogin, 1200);
      return;
    }

    delay(() => {
      lens.classList.add('sp-lens--active', 'sp-lens--scanning');

      const entry = { x: -420, y: 6, scale: 0.85 };
      const sc    = entry.scale;

      (async () => {
        if (destroyed) return;
        const p1  = getLetterOffset(0);
        const p2  = getLetterOffset(letters.length - 1);
        const p3  = getLetterOffset(4);
        const cP  = getLetterOffset(7);
        const rP  = getLetterOffset(9);
        const mid = { x: (cP.x + rP.x) / 2, y: (cP.y + rP.y) / 2 };

        await moveLens(entry,                { ...p1,  scale: sc }, 700, easeInOutCubic);
        if (destroyed) return;
        await moveLens({ ...p1, scale: sc }, { ...p2,  scale: sc }, 900, easeInOutCubic);
        if (destroyed) return;
        await moveLens({ ...p2, scale: sc }, { ...p3,  scale: sc }, 700, easeInOutCubic);
        if (destroyed) return;
        await new Promise<void>(r => delay(r, 260));
        if (destroyed) return;
        await moveLens({ ...p3, scale: sc }, { ...mid, scale: sc }, 700, easeOutExpo);
        if (destroyed) return;

        lens.classList.remove('sp-lens--scanning');
        lens.classList.add('sp-lens--locking');

        delay(() => letters.forEach(l => { l.style.transform = ''; l.style.filter = ''; }), 120);

        delay(() => {
          wordmark.classList.add('sp-wordmark--glowing');
          partner?.classList.add('sp-partner--visible');
          // bloom
          try {
            if (bloom) {
              const t = getTargetOffset();
              bloom.style.left = `calc(50% + ${t.x}px)`;
              bloom.style.top  = `calc(50% + ${t.y}px)`;
              bloom.classList.remove('sp-bloom--active');
              void bloom.offsetWidth;
              bloom.classList.add('sp-bloom--active');
            }
          } catch (_) {}
          // ripple
          try {
            const or = ghostO.getBoundingClientRect();
            rippleDrop(
              (or.left + or.right)  / 2 || window.innerWidth  / 2,
              (or.top  + or.bottom) / 2 || window.innerHeight / 2,
              1.2,
            );
          } catch (_) {}
        }, 180);

        delay(goToLogin, 180 + 1500 + 900);
      })();
    }, 900);

    return () => {
      destroyed = true;
      timers.forEach(clearTimeout);
      rippleRunning = false;
      if (rippleRafId) cancelAnimationFrame(rippleRafId);
      window.removeEventListener('resize', resizeLensToO);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{SPLASH_STYLES}</style>
      <section ref={splashRef} className="sp-splash" aria-label="Loading InvestScore">
        <div className="sp-splash__bg" />
        <div className="sp-splash__vignette" />
        <div className="sp-splash__grain" />
        <canvas ref={waterCanvasRef} className="sp-water-canvas" aria-hidden="true" />

        <div ref={stageRef} className="sp-stage">
          <h1 ref={wordmarkRef} className="sp-wordmark" aria-label="InvestScore">
            <span className="sp-letter">I</span>
            <span className="sp-letter">N</span>
            <span className="sp-letter">V</span>
            <span className="sp-letter">E</span>
            <span className="sp-letter">S</span>
            <span className="sp-letter">T</span>
            <span className="sp-letter">S</span>
            <span className="sp-letter">C</span>
            <span ref={ghostORef} className="sp-letter sp-letter--ghost">O</span>
            <span className="sp-letter">R</span>
            <span className="sp-letter">E</span>
          </h1>

          <div ref={lensRef} className="sp-lens" aria-hidden="true">
            <div className="sp-lens__handle" />
            <div className="sp-lens__ring">
              <div className="sp-lens__glass">
                <div className="sp-lens__specular" />
              </div>
            </div>
          </div>

          <div ref={emblemBloomRef} className="sp-emblem-bloom" aria-hidden="true" />

          <div ref={partnerRef} className="sp-partner" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sp-partner__logo" src="/sanlam_logo.png" alt="Sanlam Investments" />
            <div className="sp-partner__rule" />
            <div className="sp-partner__by">
              Powered by Sanlam Investments &middot; Twin&nbsp;Transition&nbsp;Challenge
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const SPLASH_STYLES = `
  .sp-splash {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; overflow: hidden;
    opacity: 0;
    animation: sp-appear 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
    font-family: 'Helvetica Neue', 'Inter', Arial, sans-serif;
  }
  @keyframes sp-appear { from { opacity:0; } to { opacity:1; } }
  .sp-splash--fading {
    animation: sp-fade-out 0.85s cubic-bezier(0.65,0,0.35,1) forwards !important;
  }
  @keyframes sp-fade-out {
    from { opacity:1; filter:blur(0px); }
    to   { opacity:0; filter:blur(6px); }
  }

  .sp-splash__bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 38%, #0f2c54 0%, #0a1f3d 45%, #060f1f 100%);
  }
  .sp-splash__bg::after {
    content:''; position:absolute; inset:-20%;
    background:
      radial-gradient(circle at 30% 70%, rgba(58,95,143,0.16), transparent 55%),
      radial-gradient(circle at 75% 25%, rgba(176,138,78,0.07), transparent 50%);
    animation: sp-bg-drift 9s ease-in-out infinite alternate;
  }
  @keyframes sp-bg-drift {
    from { transform:translate(-2%,-1%) scale(1); }
    to   { transform:translate(2%,1%) scale(1.05); }
  }
  .sp-splash__vignette {
    position:absolute; inset:0; pointer-events:none;
    background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%);
  }
  .sp-splash__grain {
    position:absolute; inset:0; opacity:0.035; pointer-events:none; mix-blend-mode:overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .sp-water-canvas {
    position:fixed; inset:0; width:100vw; height:100vh;
    pointer-events:none; z-index:4; mix-blend-mode:overlay;
  }

  .sp-stage {
    position:relative; z-index:5;
    display:flex; flex-direction:column; align-items:center; gap:28px;
  }

  .sp-wordmark {
    font-weight:700; color:#ffffff;
    text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    position:relative; z-index:12; margin:0; padding:0;
    font-size: clamp(3.2rem, 12vw, 7.2rem);
  }
  .sp-wordmark::before, .sp-wordmark::after { display:none !important; }
  .sp-wordmark.sp-wordmark--glowing {
    text-shadow: 0 0 36px rgba(176,138,78,0.55), 0 0 70px rgba(176,138,78,0.25);
  }

  .sp-letter {
    display:inline-block; opacity:0;
    transform:translate3d(0,0,0);
    will-change:transform,filter,opacity;
    transition:opacity 0.12s ease;
  }
  .sp-letter.sp-lens-revealed { opacity:1; }
  .sp-letter--ghost { visibility:hidden; }

  .sp-lens {
    position:absolute; top:50%; left:50%;
    width:72px; height:72px;
    transform: translate3d(-50%,-50%,0)
               translate3d(var(--lx,-420px),var(--ly,0px),0)
               scale3d(var(--lscale,1),var(--lscale,1),1)
               rotate(-38deg);
    opacity:0; pointer-events:none;
    transition:opacity 0.4s ease;
    will-change:transform;
    filter:drop-shadow(0 18px 40px rgba(0,0,0,0.55));
    transform-style:preserve-3d; z-index:30;
  }
  .sp-lens.sp-lens--active { opacity:1; }

  .sp-lens__handle {
    position:absolute; top:100%; left:50%;
    width:18%; height:62%; border-radius:6px;
    transform-origin:50% 8%; pointer-events:none;
    background:linear-gradient(180deg,#2a2a2a 0%,#0f0f0f 100%);
    box-shadow:0 8px 18px rgba(0,0,0,0.8),inset 0 1px 2px rgba(255,255,255,0.08);
    transition:background 320ms ease,box-shadow 320ms ease;
  }
  .sp-lens__handle::before {
    content:''; position:absolute; left:50%; top:-8%;
    width:90%; height:24%; margin-left:-45%;
    border-radius:50% 50% 6px 6px;
    background:linear-gradient(180deg,#1a1a1a 0%,#2a2a2a 100%);
    box-shadow:inset 0 2px 4px rgba(255,255,255,0.1),0 4px 12px rgba(0,0,0,0.7);
    transition:background 320ms ease,box-shadow 320ms ease;
  }
  .sp-lens__handle::after {
    content:''; position:absolute; left:50%; bottom:-6%;
    width:85%; height:22%; margin-left:-42.5%;
    border-radius:0 0 6px 6px;
    background:linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 100%);
    box-shadow:inset 0 1px 2px rgba(255,255,255,0.05),0 3px 10px rgba(0,0,0,0.8);
    transition:background 320ms ease,box-shadow 320ms ease;
  }
  .sp-lens.sp-lens--locking .sp-lens__handle {
    background:linear-gradient(180deg,#ffffff 0%,#f2f2f2 100%);
    box-shadow:0 10px 22px rgba(0,0,0,0.48),inset 0 1px 2px rgba(255,255,255,0.6);
  }
  .sp-lens.sp-lens--locking .sp-lens__handle::before {
    background:linear-gradient(180deg,#ffffff 0%,#f2f2f2 100%);
    box-shadow:inset 0 2px 6px rgba(0,0,0,0.08),0 6px 14px rgba(0,0,0,0.28);
  }
  .sp-lens.sp-lens--locking .sp-lens__handle::after {
    background:linear-gradient(180deg,#fafafa 0%,#e9e9e9 100%);
    box-shadow:inset 0 1px 2px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.28);
  }

  .sp-lens__ring {
    position:absolute; inset:0; border-radius:50%;
    background:transparent;
    border:4px solid rgba(6,6,6,0.95);
    box-shadow:0 8px 20px rgba(0,0,0,0.45),inset 0 2px 4px rgba(255,255,255,0.03);
    padding:2px;
    transition:border-color 360ms ease,box-shadow 360ms ease;
  }
  .sp-lens.sp-lens--locking .sp-lens__ring {
    border-color:rgba(255,255,255,0.95);
    box-shadow:0 10px 26px rgba(0,0,0,0.45),
               inset 0 2px 6px rgba(255,255,255,0.06),
               inset 0 0 0 1px rgba(255,255,255,0.35),
               0 0 34px rgba(255,255,255,0.18);
  }

  .sp-lens__glass {
    position:relative; width:100%; height:100%;
    border-radius:50%; background:transparent;
    overflow:hidden; pointer-events:none;
  }
  .sp-lens__glass::after {
    content:''; position:absolute; inset:0;
    mix-blend-mode:overlay;
    background:linear-gradient(120deg,
      rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 36%,
      rgba(0,0,0,0.06) 52%, rgba(255,255,255,0.02) 100%);
    opacity:0.12; filter:blur(1.6px);
    transform:translateX(-30%);
    animation:sp-lens-shimmer 3s linear infinite;
  }
  @keyframes sp-lens-shimmer { to { transform:translateX(50%); } }
  .sp-lens__specular { position:absolute; top:14%; left:18%; width:30%; height:18%; border-radius:50%; opacity:0; }

  .sp-emblem-bloom {
    position:absolute; top:50%; left:50%;
    width:4px; height:4px; pointer-events:none; z-index:9;
    transform:translate3d(-50%,-50%,0);
  }
  .sp-emblem-bloom::before, .sp-emblem-bloom::after {
    content:''; position:absolute; top:50%; left:50%;
    border-radius:50%; border:1px solid rgba(227,192,138,0);
    transform:translate3d(-50%,-50%,0) scale(0.2); opacity:0;
  }
  .sp-emblem-bloom.sp-bloom--active::before {
    width:220px; height:220px;
    animation:sp-bloom-ring 1.1s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .sp-emblem-bloom.sp-bloom--active::after {
    width:220px; height:220px;
    animation:sp-bloom-ring 1.1s cubic-bezier(0.16,1,0.3,1) forwards 0.16s;
  }
  @keyframes sp-bloom-ring {
    0%   { transform:translate3d(-50%,-50%,0) scale(0.15); opacity:0; border-color:rgba(227,192,138,0); }
    18%  { opacity:0.55; border-color:rgba(227,192,138,0.55); }
    100% { transform:translate3d(-50%,-50%,0) scale(1); opacity:0; border-color:rgba(227,192,138,0); }
  }

  .sp-partner {
    display:flex; flex-direction:column; align-items:center; gap:12px;
    opacity:0; transform:translateY(6px) scale(0.995);
    transition:opacity 360ms cubic-bezier(0.16,1,0.3,1), transform 360ms cubic-bezier(0.16,1,0.3,1);
    pointer-events:none; z-index:12;
  }
  .sp-partner.sp-partner--visible { opacity:1; transform:translateY(0) scale(1); }
  .sp-partner__logo { width:140px; height:auto; display:block; filter:drop-shadow(0 6px 18px rgba(0,0,0,0.48)); }
  .sp-partner__rule { width:28px; height:1px; background:linear-gradient(90deg,transparent,rgba(227,192,138,0.55),transparent); }
  .sp-partner__by {
    font-family:'SF Mono','IBM Plex Mono','Courier New',monospace;
    font-size:0.66rem; letter-spacing:0.08em; text-transform:uppercase;
    color:rgba(238,242,248,0.55); font-weight:400; text-align:center;
  }

  @media (prefers-reduced-motion:reduce) {
    .sp-splash,.sp-letter,.sp-lens { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
  }
`;
