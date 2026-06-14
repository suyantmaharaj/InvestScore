'use client';

import { useState, useEffect, useCallback } from 'react';

async function apiFetch(path: string, options?: RequestInit): Promise<Response | null> {
  if (!process.env.NEXT_PUBLIC_API_URL) return null;
  const { auth } = await import('@/lib/firebase');
  const token = await auth.currentUser?.getIdToken();
  if (!token) return null;
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  });
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/watchlist');
        if (!res?.ok) return;
        const json = await res.json();
        setWatchlist(json.watchlist ?? []);
      } catch (err) {
        if (!(err instanceof TypeError)) console.error('Load watchlist error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = useCallback((companyId: string) => {
    setWatchlist(prev => {
      const next = prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId];

      (async () => {
        try {
          await apiFetch('/api/watchlist', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ watchlist: next }),
          });
        } catch (err) {
          if (!(err instanceof TypeError)) console.error('Toggle watchlist error:', err);
        }
      })();

      return next;
    });
  }, []);

  return {
    watchlist,
    loading,
    toggle,
    isWatched: (id: string) => watchlist.includes(id),
  };
}
