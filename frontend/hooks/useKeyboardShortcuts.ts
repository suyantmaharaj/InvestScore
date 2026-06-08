'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useSMEKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'd': router.push('/dashboard');    break;
        case 's': router.push('/scorecard');    break;
        case 'b': router.push('/benchmarking'); break;
        case 'c': router.push('/coach');        break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
}
