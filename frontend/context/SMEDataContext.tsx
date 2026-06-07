'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { CompanyData, ScorecardData } from '@/hooks/useSMEData';

interface SMEDataContextValue {
  company:   CompanyData | null;
  scorecard: ScorecardData | null;
  loading:   boolean;
  error:     string | null;
  refresh:   () => void;
}

const SMEDataContext = createContext<SMEDataContextValue>({
  company:   null,
  scorecard: null,
  loading:   true,
  error:     null,
  refresh:   () => {},
});

export function SMEDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company,   setCompany]   = useState<CompanyData | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tick,      setTick]      = useState(0);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const [companySnap, scorecardSnap] = await Promise.all([
          getDoc(doc(db, 'companies', user.companyId!)),
          getDocs(query(collection(db, 'scorecards'), where('companyId', '==', user.companyId))),
        ]);

        if (cancelled) return;

        if (companySnap.exists()) {
          setCompany({ id: companySnap.id, ...companySnap.data() } as CompanyData);
        }

        if (!scorecardSnap.empty) {
          const sorted = scorecardSnap.docs
            .map(d => d.data() as ScorecardData)
            .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
          setScorecard(sorted[0]);
        }

        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error('SMEDataContext error:', err);
          setError('Failed to load data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.companyId, tick]);

  return (
    <SMEDataContext.Provider value={{ company, scorecard, loading, error, refresh }}>
      {children}
    </SMEDataContext.Provider>
  );
}

export const useSMEContext = () => useContext(SMEDataContext);
