'use client';

import { useState, useEffect, useCallback } from 'react';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setWatchlist(json.watchlist ?? []);
      } catch (err) {
        console.error('Load watchlist error:', err);
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
          const { auth } = await import('@/lib/firebase');
          const token = await auth.currentUser?.getIdToken();
          if (!token) return;
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/watchlist`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ watchlist: next }),
          });
        } catch (err) {
          console.error('Toggle watchlist error:', err);
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
