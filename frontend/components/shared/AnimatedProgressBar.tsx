'use client';

import { useEffect, useState } from 'react';

interface Props {
  value:       number;
  color:       string;
  height?:     number;
  delay?:      number;
  background?: string;
}

export default function AnimatedProgressBar({
  value, color, height = 8, delay = 0, background,
}: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.max(0, Math.min(100, value)));
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height, background: background || 'var(--border, #DDE3EC)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width:      `${width}%`,
          background: color,
          transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
}
