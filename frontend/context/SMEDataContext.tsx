'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getCached, setCached, invalidateCache } from '@/lib/queryClient';
import type { CompanyData, ScorecardData } from '@/hooks/useSMEData';

interface SMECoreCache { company: CompanyData; scorecard: ScorecardData | null; }

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

  const refresh = () => {
    invalidateCache('sme_data_');
    setTick(t => t + 1);
  };

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const cacheKey = `sme_data_${user.companyId}`;

      // Serve from cache instantly — no loading flash on return visits
      const cached = getCached<SMECoreCache>(cacheKey);
      if (cached) {
        if (!cancelled) {
          setCompany(cached.company);
          setScorecard(cached.scorecard);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const [companySnap, scorecardSnap] = await Promise.all([
          getDoc(doc(db, 'companies', user.companyId!)),
          getDocs(query(collection(db, 'scorecards'), where('companyId', '==', user.companyId))),
        ]);

        if (cancelled) return;

        let company: CompanyData | null = null;
        if (companySnap.exists()) {
          company = { id: companySnap.id, ...companySnap.data() } as CompanyData;
          setCompany(company);
        }

        let scorecard: ScorecardData | null = null;
        if (!scorecardSnap.empty) {
          const sorted = scorecardSnap.docs
            .map(d => d.data() as ScorecardData)
            .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
          scorecard = sorted[0];
          setScorecard(scorecard);
        }

        if (company) setCached<SMECoreCache>(cacheKey, { company, scorecard });
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
