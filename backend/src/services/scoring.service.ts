import { SECTOR_WEIGHTS, KPI_THRESHOLDS, INVERTED_KPIS, classifyScore, ScoreLevel, SectorType } from '../constants/scoring.constants';
import { SDG_LIST } from '../constants/sdg.constants';
import { KPI_LIST } from '../constants/kpi.constants';
import { CompanyScorecard, SDGScore } from '../types';

// IMMUTABLE SCORING ENGINE
// Implements Sanlam's fixed methodology.
// Must never be altered by AI features or user input.

export interface KPIInput {
  kpiId: string;
  value: number | null;
}

interface KPIResult {
  kpiId:        string;
  value:        number | null;
  score:        number;       // 1, 2, or 3
  weight:       number;
  contribution: number;
}

function scoreKPI(kpiId: string, value: number | null): number {
  if (value === null || value === undefined) return 0; // N/A

  const threshold = KPI_THRESHOLDS[kpiId];
  if (!threshold) return 2; // Default medium if no threshold defined

  const { low, high } = threshold;
  const inverted = INVERTED_KPIS.has(kpiId);

  if (inverted) {
    if (value <= high) return 3;
    if (value <= low)  return 2;
    return 1;
  } else {
    if (value >= high) return 3;
    if (value >= low)  return 2;
    return 1;
  }
}

export function calculateScore(
  sector:    SectorType,
  kpiInputs: KPIInput[]
): { overallScore: number; classification: ScoreLevel; kpiResults: KPIResult[] } {

  const weights    = SECTOR_WEIGHTS[sector] || SECTOR_WEIGHTS.other;
  const inputMap   = new Map(kpiInputs.map(k => [k.kpiId, k.value]));
  const applicable = Object.entries(weights).filter(([, w]) => w > 0);

  const scoredKPIs: KPIResult[]  = [];
  const naWeights:  number[]     = [];

  for (const [kpiId, weight] of applicable) {
    const value = inputMap.get(kpiId) ?? null;
    const score = scoreKPI(kpiId, value);

    if (score === 0) {
      naWeights.push(weight);
    } else {
      scoredKPIs.push({ kpiId, value, score, weight, contribution: 0 });
    }
  }

  const totalNAWeight     = naWeights.reduce((a, b) => a + b, 0);
  const totalActiveWeight = scoredKPIs.reduce((a, k) => a + k.weight, 0);

  if (totalActiveWeight === 0) {
    return { overallScore: 1.0, classification: 'Low', kpiResults: [] };
  }

  const redistributionFactor = 1 + (totalNAWeight / totalActiveWeight);

  let overallScore = 0;
  for (const kpi of scoredKPIs) {
    const adjustedWeight = kpi.weight * redistributionFactor;
    kpi.contribution = kpi.score * adjustedWeight;
    overallScore += kpi.contribution;
  }

  overallScore = Math.min(3.0, Math.max(1.0, overallScore));
  const roundedScore = Math.round(overallScore * 100) / 100;

  return {
    overallScore:   roundedScore,
    classification: classifyScore(roundedScore),
    kpiResults:     scoredKPIs,
  };
}

export function calculateSDGScores(
  kpiResults:     KPIResult[],
  sectorAvgData?: Record<number, number>
): SDGScore[] {
  const sdgScores: SDGScore[] = [];

  for (const sdg of SDG_LIST) {
    const sdgKPIs         = KPI_LIST.filter(k => k.sdgs.includes(sdg.id));
    const relevantResults = kpiResults.filter(r => sdgKPIs.some(k => k.id === r.kpiId));

    if (relevantResults.length === 0) continue;

    const avgScore  = relevantResults.reduce((a, r) => a + r.score, 0) / relevantResults.length;
    const rounded   = Math.round(avgScore * 100) / 100;
    const sectorAvg = sectorAvgData?.[sdg.id] ?? 2.0;

    sdgScores.push({
      sdgId:          sdg.id,
      sdgName:        sdg.name,
      score:          Math.min(3, Math.max(1, rounded)),
      classification: classifyScore(rounded),
      sectorAvg,
      trend:          'stable',
    });
  }

  return sdgScores;
}
