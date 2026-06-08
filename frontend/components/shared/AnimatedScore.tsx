'use client';

import { useEffect, useState } from 'react';

interface Props {
  value:     number;
  decimals?: number;
  duration?: number;
  className?: string;
  style?:    React.CSSProperties;
}

export default function AnimatedScore({
  value, decimals = 1, duration = 1000, className = '', style,
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const from = 0;
    const to   = value;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {display.toFixed(decimals)}
    </span>
  );
}
