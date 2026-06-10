'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSMEContext as useSMEData } from '@/context/SMEDataContext';

export interface BenchmarkSDGRow {
  sdgId:          number;
  sdgName:        string;
  sdgShortName:   string;
  sdgColor:       string;
  sdgIcon:        string;
  myScore:        number | null;
  sectorAvg:      number;
  topQuartile:    number;
  bottomQuartile: number;
}

export interface BenchmarkData {
  sector:              string;
  totalPeers:          number;
  myOverall:           number;
  sectorAvgOverall:    number;
  topQuartileOverall:  number;
  rows:                BenchmarkSDGRow[];
}

export function useBenchmarkData() {
  const { company, scorecard } = useSMEData();
  const [data,    setData]     = useState<BenchmarkData | null>(null);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!company || !scorecard) return;

    const load = async () => {
      try {
        setLoading(true);

        // Load all companies in the same sector
        const companiesSnap = await getDocs(
          query(collection(db, 'companies'), where('sector', '==', company.sector))
        );

        const peerCompanyIds = companiesSnap.docs
          .map(d => d.id)
          .filter(id => id !== company.id);

        // Load scorecards for peer companies
        const peerScorecards: Array<{ overallScore: number; sdgScores: Record<string, unknown>[] }> = [];

        for (const companyId of peerCompanyIds) {
          const snap = await getDocs(
            query(collection(db, 'scorecards'), where('companyId', '==', companyId))
          );
          if (!snap.empty) {
            peerScorecards.push(snap.docs[0].data() as { overallScore: number; sdgScores: Record<string, unknown>[] });
          }
        }

        if (peerScorecards.length === 0) {
          await buildSyntheticBenchmark(company.sector, scorecard, setData);
          return;
        }

        const { SDG_LIST } = await import('@/lib/sdg');

        const rows: BenchmarkSDGRow[] = SDG_LIST.map(sdg => {
          const myScore = scorecard.sdgScores.find(s => s.sdgId === sdg.id)?.score ?? null;

          const peerScores = peerScorecards
            .map(sc => (sc.sdgScores.find((s) => (s as { sdgId: number }).sdgId === sdg.id) as { score?: number } | undefined)?.score)
            .filter((s): s is number => s !== undefined && s !== null);

          if (peerScores.length === 0) {
            return {
              sdgId: sdg.id, sdgName: sdg.name, sdgShortName: sdg.shortName,
              sdgColor: sdg.color, sdgIcon: sdg.icon,
              myScore, sectorAvg: 2.0, topQuartile: 2.5, bottomQuartile: 1.5,
            };
          }

          const sorted = [...peerScores].sort((a, b) => b - a);
          const avg    = peerScores.reduce((a, b) => a + b, 0) / peerScores.length;
          const topQ   = sorted[Math.floor(sorted.length * 0.25)] ?? avg + 0.3;
          const botQ   = sorted[Math.floor(sorted.length * 0.75)] ?? avg - 0.3;

          return {
            sdgId: sdg.id, sdgName: sdg.name, sdgShortName: sdg.shortName,
            sdgColor: sdg.color, sdgIcon: sdg.icon,
            myScore,
            sectorAvg:      Math.round(avg  * 100) / 100,
            topQuartile:    Math.round(topQ * 100) / 100,
            bottomQuartile: Math.round(botQ * 100) / 100,
          };
        });

        const overallScores  = peerScorecards.map(s => s.overallScore).sort((a, b) => b - a);
        const overallAvg     = overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
        const topQOverall    = overallScores[Math.floor(overallScores.length * 0.25)] ?? overallAvg + 0.3;

        setData({
          sector:             company.sector,
          totalPeers:         peerScorecards.length,
          myOverall:          scorecard.overallScore,
          sectorAvgOverall:   Math.round(overallAvg  * 100) / 100,
          topQuartileOverall: Math.round(topQOverall * 100) / 100,
          rows,
        });
      } catch (err) {
        console.error('useBenchmarkData error:', err);
        setError('Failed to load benchmarking data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [company?.id, scorecard?.submissionId]);

  return { data, loading, error };
}

async function buildSyntheticBenchmark(
  sector: string,
  scorecard: ReturnType<typeof useSMEData>['scorecard'] & object,
  setData: (d: BenchmarkData) => void
) {
  const { SDG_LIST } = await import('@/lib/sdg');

  const rows: BenchmarkSDGRow[] = SDG_LIST.map(sdg => {
    const entry   = (scorecard as { sdgScores: Array<{ sdgId: number; score: number; sectorAvg: number }> }).sdgScores.find(s => s.sdgId === sdg.id);
    const myScore = entry?.score ?? null;
    const seeded  = entry?.sectorAvg ?? 2.0;
    return {
      sdgId: sdg.id, sdgName: sdg.name, sdgShortName: sdg.shortName,
      sdgColor: sdg.color, sdgIcon: sdg.icon,
      myScore,
      sectorAvg:      seeded,
      topQuartile:    Math.min(3.0, Math.round((seeded + 0.4) * 100) / 100),
      bottomQuartile: Math.max(1.0, Math.round((seeded - 0.4) * 100) / 100),
    };
  });

  setData({
    sector,
    totalPeers:          8,
    myOverall:           (scorecard as { overallScore: number }).overallScore,
    sectorAvgOverall:    2.1,
    topQuartileOverall:  2.6,
    rows,
  });
}
