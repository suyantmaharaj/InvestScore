'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PMPortfolioEntry, PMScorecard } from './usePMData';
import { calculateAttentionScore, AttentionScoreResult } from '@/lib/attention-score';

export function useAttentionScores(portfolio: PMPortfolioEntry[]) {
  const [scores,  setScores]  = useState<AttentionScoreResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portfolio.length === 0) { setLoading(false); return; }

    const load = async () => {
      try {
        setLoading(true);
        const now             = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();

        const results = await Promise.all(
          portfolio.map(async ({ company, scorecard }) => {
            const [historySnap, subSnap, targetDoc] = await Promise.all([
              getDocs(query(collection(db, 'scorecards'), where('companyId', '==', company.id))),
              getDocs(query(collection(db, 'submissions'), where('companyId', '==', company.id))),
              getDoc(doc(db, 'targets', company.id)),
            ]);

            const recentScores = historySnap.docs
              .map(d => d.data() as PMScorecard)
              .sort((a, b) => a.calculatedAt.localeCompare(b.calculatedAt))
              .slice(-4)
              .map(s => s.overallScore);

            const scoredDocs = subSnap.docs.filter(d => d.data().status === 'scored');

            const allSubs = scoredDocs
              .map(d => d.data())
              .sort((a, b) => (b.scoredAt ?? b.submittedAt ?? '').localeCompare(a.scoredAt ?? a.submittedAt ?? ''));

            const subsInYear = scoredDocs.filter(d => {
              const s = d.data();
              return (s.scoredAt ?? s.submittedAt ?? '') >= twelveMonthsAgo;
            }).length;

            const lastSubDate    = allSubs[0]?.scoredAt ?? allSubs[0]?.submittedAt;
            const daysSinceLast  = lastSubDate
              ? Math.floor((now.getTime() - new Date(lastSubDate).getTime()) / 86400000)
              : 365;

            const kpiData        = allSubs[0]?.data ?? {};
            const kpiValues      = Object.values(kpiData) as (number | null)[];
            const kpiCompleteness = kpiValues.length > 0
              ? kpiValues.filter(v => v !== null && v !== undefined).length / kpiValues.length
              : 0;

            const targetsMap    = targetDoc.exists() ? (targetDoc.data()?.targets ?? {}) as Record<string, number> : {};
            const targetEntries = Object.entries(targetsMap).map(([sdgId, v]) => ({ sdgId: parseInt(sdgId), targetScore: v }));
            const hasTargets    = targetEntries.length > 0;
            let targetAttainment = 0;
            if (hasTargets && scorecard) {
              const met = targetEntries.filter(t => {
                const s = scorecard.sdgScores.find(x => x.sdgId === t.sdgId);
                return s && s.score >= t.targetScore;
              });
              targetAttainment = met.length / targetEntries.length;
            }

            return calculateAttentionScore({
              companyId:             company.id,
              companyName:           company.name,
              recentScores,
              submissionsLast12:     subsInYear,
              daysSinceLastSub:      daysSinceLast,
              kpiCompleteness,
              hasTargets,
              targetAttainment,
              currentScore:          scorecard?.overallScore ?? 0,
              currentClassification: scorecard?.classification ?? 'Low',
            });
          })
        );

        setScores(results.sort((a, b) => b.attentionScore - a.attentionScore));
      } catch (err) {
        console.error('useAttentionScores error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolio.length]);

  return { scores, loading };
}
