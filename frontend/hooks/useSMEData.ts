'use client';

import { useState, useEffect } from 'react';
import {
  doc, getDoc,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { getCached, setCached } from '@/lib/queryClient';

export interface SDGScoreData {
  sdgId:          number;
  sdgName:        string;
  score:          number;
  classification: 'Low' | 'Medium' | 'High';
  sectorAvg:      number;
  trend:          'up' | 'down' | 'stable';
}

export interface ScorecardData {
  companyId:        string;
  submissionId:     string;
  overallScore:     number;
  classification:   'Low' | 'Medium' | 'High';
  sdgScores:        SDGScoreData[];
  calculatedAt:     string;
  submissionPeriod: string;
}

export interface CompanyData {
  id:               string;
  name:             string;
  sector:           string;
  industry:         string;
  location:         string;
  description:      string;
  spokespersonName: string;
}

export function useSMEData() {
  const { user } = useAuth();
  const [company,   setCompany]   = useState<CompanyData | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user?.companyId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const cacheKey = `sme_data_${user.companyId}`;
        const cached   = getCached<{ company: CompanyData; scorecard: ScorecardData }>(cacheKey);
        if (cached) {
          setCompany(cached.company);
          setScorecard(cached.scorecard);
          setLoading(false);
          return;
        }

        // Load company profile
        const companySnap = await getDoc(doc(db, 'companies', user.companyId!));
        let companyData: CompanyData | null = null;
        if (companySnap.exists()) {
          companyData = { id: companySnap.id, ...companySnap.data() } as CompanyData;
          setCompany(companyData);
        }

        // Load scorecards — query by companyId only (no orderBy = no composite index needed)
        const snap = await getDocs(
          query(collection(db, 'scorecards'), where('companyId', '==', user.companyId))
        );

        let scorecardData: ScorecardData | null = null;
        if (!snap.empty) {
          const sorted = snap.docs
            .map(d => d.data() as ScorecardData)
            .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
          scorecardData = sorted[0];
          setScorecard(scorecardData);
        }

        if (companyData && scorecardData) {
          setCached(cacheKey, { company: companyData, scorecard: scorecardData });
        }
      } catch (err) {
        console.error('useSMEData error:', err);
        setError('Failed to load your data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.companyId]);

  return { company, scorecard, loading, error };
}
