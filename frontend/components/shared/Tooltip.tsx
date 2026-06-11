'use client';

import { useState, useRef, ReactNode } from 'react';

interface Props {
  content:   ReactNode;
  children:  ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?:    number;
}

export default function Tooltip({ content, children, position = 'top', delay = 300 }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => { timer.current = setTimeout(() => setVisible(true), delay); };
  const hide = () => { clearTimeout(timer.current); setVisible(false); };

  const posClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={`absolute ${posClasses} z-50 pointer-events-none animate-tooltip-in`}
          data-position={position}
          style={{ minWidth: '120px', maxWidth: '220px' }}
        >
          <div
            className="px-3 py-2 rounded-lg text-xs font-medium text-center shadow-lg"
            style={{
              background: 'var(--text-primary, #015376)',
              color:      'var(--bg, #F4F6F8)',
              border:     '1px solid var(--border, #DDE3EC)',
            }}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
