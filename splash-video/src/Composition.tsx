import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '500', '700', '800'],
  subsets: ['latin'],
});

const TEAL  = '#00B5ED';
const GREEN = '#00A651';

function lerp(
  frame: number,
  inRange: [number, number],
  outRange: [number, number],
  easing?: (t: number) => number,
): number {
  return interpolate(frame, inRange, outRange, {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
}

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN  = Easing.bezier(0.55, 0, 1, 0.45);

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPOSITION
// ─────────────────────────────────────────────────────────────────────────────

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const exitStart = Math.round(3.7 * fps); // f111

  const exitOpacity = lerp(frame, [exitStart, durationInFrames], [1, 0], EASE_IN);
  const exitScale   = lerp(frame, [exitStart, durationInFrames], [1, 1.06]);
  const exitBlur    = lerp(frame, [exitStart, durationInFrames], [0, 8]);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        opacity:   exitOpacity,
        transform: `scale(${exitScale})`,
        filter:    `blur(${exitBlur}px)`,
        overflow:  'hidden',
      }}
    >
      <Background />
      <PulsingRings />
      <StaticRings />
      <Content />
      <ProgressBar exitStart={exitStart} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND — layered radial gradients with slowly drifting ambient blobs
// ─────────────────────────────────────────────────────────────────────────────

const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const b1x = 50 + Math.sin(frame * 0.014) * 4.5;
  const b1y = 42 + Math.cos(frame * 0.011) * 3.8;
  const b2x = 70 + Math.cos(frame * 0.017) * 5.5;
  const b2y = 65 + Math.sin(frame * 0.013) * 4.2;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 130% 115% at 50% 44%, #023558 0%, #011d32 50%, #010a18 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 580px at ${b1x}% ${b1y}%, rgba(0,181,237,0.09) 0%, transparent 65%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 420px at ${b2x}% ${b2y}%, rgba(0,166,81,0.055) 0%, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PULSING RINGS — three rings that expand and fade in staggered pulses
// ─────────────────────────────────────────────────────────────────────────────

const PulsingRings: React.FC = () => {
  const frame = useCurrentFrame();
  const CYCLE = 54;

  return (
    <AbsoluteFill
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {[0, 18, 36].map((delay) => {
        const lf = Math.max(0, frame - delay);
        const cf = lf % CYCLE;

        const scale = lerp(cf, [0, CYCLE], [0.6, 1.6]);
        const opacity = interpolate(
          cf,
          [0, CYCLE * 0.15, CYCLE * 0.72, CYCLE],
          [0, 0.32, 0.08, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        return (
          <div
            key={delay}
            style={{
              position:     'absolute',
              width:        300,
              height:       300,
              borderRadius: '50%',
              border:       '1px solid rgba(0,181,237,0.9)',
              opacity,
              transform:    `scale(${scale})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC RINGS — three large concentric decorative rings that fade in
// ─────────────────────────────────────────────────────────────────────────────

const StaticRings: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {[440, 650, 900].map((size, i) => {
        const opacity = lerp(frame, [4 + i * 5, 22 + i * 5], [0, 0.038 - i * 0.009], EASE_OUT);
        return (
          <div
            key={size}
            style={{
              position:     'absolute',
              width:        size,
              height:       size,
              borderRadius: '50%',
              border:       `1px solid rgba(255,255,255,${opacity.toFixed(3)})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT — all central elements in a vertical flex column
// ─────────────────────────────────────────────────────────────────────────────

const Content: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Icon — frame 5, spring entrance
  const iconSpr     = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.72, stiffness: 165 } });
  const iconOpacity = lerp(frame, [5, 15], [0, 1]);
  const iconScale   = interpolate(iconSpr, [0, 1], [0.55, 1]);
  const iconY       = interpolate(iconSpr, [0, 1], [24, 0]);

  // "Invest" — frame 18
  const investOpacity = lerp(frame, [18, 35], [0, 1], EASE_OUT);
  const investY       = lerp(frame, [18, 33], [22, 0], EASE_OUT);
  const investBlur    = lerp(frame, [18, 30], [7, 0]);

  // "Score" — frame 28
  const scoreOpacity  = lerp(frame, [28, 44], [0, 1], EASE_OUT);
  const scoreY        = lerp(frame, [28, 42], [20, 0], EASE_OUT);
  const scoreBlur     = lerp(frame, [28, 38], [5, 0]);

  // Subtitle — frame 44
  const subtitleOpacity = lerp(frame, [44, 60], [0, 1], EASE_OUT);
  const subtitleY       = lerp(frame, [44, 58], [10, 0], EASE_OUT);

  // Divider — frame 60
  const dividerW = lerp(frame, [60, 84], [0, 180], Easing.bezier(0.23, 1, 0.32, 1));

  // Branding — frame 67
  const brandOpacity = lerp(frame, [67, 82], [0, 1], EASE_OUT);
  const brandY       = lerp(frame, [67, 81], [14, 0], EASE_OUT);

  // Challenge line — frame 73
  const chalOpacity = lerp(frame, [73, 87], [0, 1], EASE_OUT);

  return (
    <AbsoluteFill
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        paddingBottom:  48,
      }}
    >
      {/* Icon mark */}
      <div
        style={{
          width:          68,
          height:         68,
          borderRadius:   22,
          background:     'rgba(0,181,237,0.1)',
          border:         '1.5px solid rgba(0,181,237,0.22)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   34,
          opacity:        iconOpacity,
          transform:      `scale(${iconScale}) translateY(${iconY}px)`,
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TEAL}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span
          style={{
            fontSize:      96,
            fontWeight:    800,
            color:         '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight:    1,
            opacity:       investOpacity,
            transform:     `translateY(${investY}px)`,
            filter:        `blur(${investBlur}px)`,
          }}
        >
          Invest
        </span>
        <span
          style={{
            fontSize:      96,
            fontWeight:    800,
            color:         TEAL,
            letterSpacing: '-0.04em',
            lineHeight:    1,
            opacity:       scoreOpacity,
            transform:     `translateY(${scoreY}px)`,
            filter:        `blur(${scoreBlur}px)`,
          }}
        >
          Score
        </span>
      </div>

      {/* Subtitle */}
      <p
        style={{
          margin:        '16px 0 0',
          color:         'rgba(255,255,255,0.22)',
          fontSize:      12,
          fontWeight:    600,
          letterSpacing: '0.32em',
          opacity:       subtitleOpacity,
          transform:     `translateY(${subtitleY}px)`,
        }}
      >
        SDG IMPACT PLATFORM
      </p>

      {/* Expanding divider */}
      <div
        style={{
          width:      dividerW,
          height:     1,
          marginTop:  40,
          background: 'linear-gradient(90deg, transparent, rgba(0,181,237,0.38), transparent)',
        }}
      />

      {/* Branding block */}
      <div
        style={{
          marginTop:  22,
          textAlign:  'center',
          opacity:    brandOpacity,
          transform:  `translateY(${brandY}px)`,
        }}
      >
        <p
          style={{
            margin:        0,
            color:         'rgba(255,255,255,0.2)',
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: '0.22em',
          }}
        >
          POWERED BY
        </p>
        <p
          style={{
            margin:        '7px 0 0',
            color:         'rgba(255,255,255,0.72)',
            fontSize:      17,
            fontWeight:    500,
            letterSpacing: '0.01em',
          }}
        >
          Sanlam Investments
        </p>
      </div>

      {/* Challenge label */}
      <p
        style={{
          margin:        '10px 0 0',
          color:         'rgba(0,181,237,0.42)',
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: '0.17em',
          opacity:       chalOpacity,
        }}
      >
        TWIN TRANSITION CHALLENGE 2026
      </p>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR — thin teal→green line at bottom, fills over the loading period
// ─────────────────────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ exitStart: number }> = ({ exitStart }) => {
  const frame = useCurrentFrame();

  const fillW   = lerp(frame, [0, exitStart], [0, 100], Easing.bezier(0.4, 0, 0.6, 1));
  const opacity = lerp(frame, [exitStart - 12, exitStart + 6], [1, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          height:     2,
          background: 'rgba(255,255,255,0.06)',
          opacity,
        }}
      />
      <div
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          width:      `${fillW}%`,
          height:     2,
          background: `linear-gradient(90deg, ${TEAL}, ${GREEN})`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
