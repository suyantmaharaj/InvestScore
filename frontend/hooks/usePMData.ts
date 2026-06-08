'use client';

import { useState, useEffect } from 'react';
import {
  collection, getDocs, query,
  where, doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCached, setCached } from '@/lib/queryClient';

export interface PMCompany {
  id:          string;
  name:        string;
  sector:      string;
  industry:    string;
  location:    string;
  description: string;
  mandate:     string;
  bbbeeLevel:  number;
  status:      string;
  spokespersonName:  string;
  spokespersonEmail: string;
  spokespersonTitle: string;
}

export interface PMScorecard {
  companyId:        string;
  overallScore:     number;
  classification:   'Low' | 'Medium' | 'High';
  sdgScores:        Array<{
    sdgId:          number;
    sdgName:        string;
    score:          number;
    classification: 'Low' | 'Medium' | 'High';
    sectorAvg:      number;
    trend:          'up' | 'down' | 'stable';
  }>;
  submissionPeriod: string;
  calculatedAt:     string;
}

export interface PMPortfolioEntry {
  company:   PMCompany;
  scorecard: PMScorecard | null;
}

export function usePMData() {
  const [portfolio, setPortfolio] = useState<PMPortfolioEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const cacheKey = 'pm_portfolio';
        const cached   = getCached<PMPortfolioEntry[]>(cacheKey);
        if (cached) {
          setPortfolio(cached);
          setLoading(false);
          return;
        }

        const companiesSnap = await getDocs(
          query(collection(db, 'companies'), where('status', '==', 'active'))
        );

        const companies: PMCompany[] = companiesSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as PMCompany));

        const entries: PMPortfolioEntry[] = await Promise.all(
          companies.map(async company => {
            const scorecardSnap = await getDocs(
              query(
                collection(db, 'scorecards'),
                where('companyId', '==', company.id),
              )
            );

            const scorecard = scorecardSnap.empty
              ? null
              : (scorecardSnap.docs
                  .map(d => d.data() as PMScorecard)
                  .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt))[0]);

            return { company, scorecard };
          })
        );

        const sorted = entries.sort((a, b) => {
          const aScore = a.scorecard?.overallScore ?? 0;
          const bScore = b.scorecard?.overallScore ?? 0;
          return bScore - aScore;
        });

        setCached(cacheKey, sorted);
        setPortfolio(sorted);
      } catch (err) {
        console.error('usePMData error:', err);
        setError('Failed to load portfolio data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const scoredEntries = portfolio.filter(e => e.scorecard);
  const stats = {
    total:       portfolio.length,
    highCount:   portfolio.filter(e => e.scorecard?.classification === 'High').length,
    mediumCount: portfolio.filter(e => e.scorecard?.classification === 'Medium').length,
    lowCount:    portfolio.filter(e => e.scorecard?.classification === 'Low').length,
    avgScore:    scoredEntries.length > 0
      ? scoredEntries.reduce((sum, e) => sum + (e.scorecard?.overallScore ?? 0), 0) / scoredEntries.length
      : 0,
  };

  return { portfolio, stats, loading, error };
}

export function usePMCompanyDetail(companyId: string) {
  const [company,    setCompany]    = useState<PMCompany | null>(null);
  const [scorecard,  setScorecard]  = useState<PMScorecard | null>(null);
  const [submission, setSubmission] = useState<Record<string, number | null> | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const load = async () => {
      try {
        setLoading(true);

        const [companySnap, scorecardSnap, submissionSnap] = await Promise.all([
          getDoc(doc(db, 'companies', companyId)),
          getDocs(query(
            collection(db, 'scorecards'),
            where('companyId', '==', companyId),
          )),
          getDocs(query(
            collection(db, 'submissions'),
            where('companyId', '==', companyId),
            where('status', '==', 'scored'),
          )),
        ]);

        if (companySnap.exists()) setCompany({ id: companySnap.id, ...companySnap.data() } as PMCompany);

        if (!scorecardSnap.empty) {
          const latest = scorecardSnap.docs
            .map(d => d.data() as PMScorecard)
            .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt))[0];
          setScorecard(latest);
        }

        if (!submissionSnap.empty) {
          const latest = submissionSnap.docs
            .map(d => d.data())
            .sort((a, b) => (b.scoredAt ?? b.submittedAt ?? '').localeCompare(a.scoredAt ?? a.submittedAt ?? ''))[0];
          setSubmission(latest.data);
        }
      } catch (err) {
        console.error('usePMCompanyDetail error:', err);
        setError('Failed to load company detail.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId]);

  return { company, scorecard, submission, loading, error };
}
