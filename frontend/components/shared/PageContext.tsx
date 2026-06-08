'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function PageContext({ children }: Props) {
  return (
    <div
      className="flex items-center gap-3 mb-6 pb-5 flex-wrap"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {children}
    </div>
  );
}
