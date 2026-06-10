'use client';

import { useEffect, useState } from 'react';
import { toDisplay } from '@/lib/score';

interface Props {
  value:     number;
  decimals?: number;
  duration?: number;
  className?: string;
  style?:    React.CSSProperties;
  /** Pass raw=true to bypass toDisplay conversion (e.g. for values already 0–100) */
  raw?:      boolean;
}

export default function AnimatedScore({
  value, decimals = 0, duration = 1000, className = '', style, raw = false,
}: Props) {
  const target    = raw ? value : toDisplay(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const from = 0;
    const to   = target;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <span className={className} style={style}>
      {display.toFixed(decimals)}
    </span>
  );
}
