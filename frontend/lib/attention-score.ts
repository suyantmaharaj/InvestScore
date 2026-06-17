export interface AttentionScoreInput {
  companyId:             string;
  companyName:           string;
  recentScores:          number[];   // last 4 quarterly scores, oldest first
  submissionsLast12:     number;     // scored submissions in last 12 months
  daysSinceLastSub:      number;
  kpiCompleteness:       number;     // 0–1 fraction of non-null KPIs in latest submission
  hasTargets:            boolean;
  targetAttainment:      number;     // 0–1 fraction of SDG targets met or exceeded
  currentScore:          number;
  currentClassification: 'Low' | 'Medium' | 'High';
}

export type QuadrantKey = 'priority' | 'watch' | 'coaching' | 'on_track';

export const QUADRANT_CONFIG: Record<QuadrantKey, {
  label:       string;
  color:       string;
  bg:          string;
  action:      string;
  description: string;
}> = {
  priority: {
    label:       'Priority Attention',
    color:       '#EF4444',
    bg:          'rgba(239,68,68,0.06)',
    action:      'Schedule urgent review',
    description: 'Low score, low momentum — needs immediate intervention',
  },
  watch: {
    label:       'Watch',
    color:       '#F59E0B',
    bg:          'rgba(245,158,11,0.06)',
    action:      'Monitor closely this quarter',
    description: 'Declining trend despite reasonable score',
  },
  coaching: {
    label:       'Needs Coaching',
    color:       '#00B5ED',
    bg:          'rgba(0,181,237,0.06)',
    action:      'Engage to accelerate progress',
    description: 'Good momentum but room to grow — coach toward High',
  },
  on_track: {
    label:       'On Track',
    color:       '#00A651',
    bg:          'rgba(0,166,81,0.06)',
    action:      'Maintain engagement cadence',
    description: 'Strong score and positive momentum — sustain',
  },
};

export interface AttentionScoreResult {
  companyId:             string;
  companyName:           string;
  attentionScore:        number;   // 0–100, higher = more urgent attention needed
  velocity:              number;   // 0–1 component (weight 35%)
  consistency:           number;   // 0–1 component (weight 30%)
  targetAttainment:      number;   // 0–1 component (weight 20%)
  completeness:          number;   // 0–1 component (weight 15%)
  quadrant:              QuadrantKey;
  currentScore:          number;
  currentClassification: 'Low' | 'Medium' | 'High';
  trend:                 'improving' | 'declining' | 'stable';
}

export function calculateAttentionScore(input: AttentionScoreInput): AttentionScoreResult {
  // Velocity: declining scores = higher attention needed
  const velocity = (() => {
    if (input.recentScores.length < 2) return 0.5;
    const latest = input.recentScores[input.recentScores.length - 1];
    const prev   = input.recentScores[input.recentScores.length - 2];
    const delta  = latest - prev;
    // delta range −20…+20 → inverted 0…1 (decline = 1)
    return Math.max(0, Math.min(1, (20 - delta) / 40));
  })();

  // Consistency: low submission frequency = higher attention needed
  const consistency = (() => {
    const ratio = input.submissionsLast12 / 4; // 4 per year = ideal
    return Math.max(0, Math.min(1, 1 - ratio * 0.8));
  })();

  // Target attainment: unmet targets = higher attention needed
  const targetAttainment = (() => {
    if (!input.hasTargets) return 0.5;
    return Math.max(0, Math.min(1, 1 - input.targetAttainment));
  })();

  // Completeness: incomplete data = higher attention needed
  const completeness = Math.max(0, Math.min(1, 1 - input.kpiCompleteness));

  const attentionScore = Math.round(
    (velocity         * 0.35 +
     consistency      * 0.30 +
     targetAttainment * 0.20 +
     completeness     * 0.15) * 100
  );

  const trend: 'improving' | 'declining' | 'stable' = (() => {
    if (input.recentScores.length < 2) return 'stable';
    const delta = input.recentScores[input.recentScores.length - 1] -
                  input.recentScores[input.recentScores.length - 2];
    if (delta > 1.5)  return 'improving';
    if (delta < -1.5) return 'declining';
    return 'stable';
  })();

  // overallScore is on a 1–3 scale; use classification rather than a raw threshold
  const isLowScore      = input.currentClassification === 'Low';
  const isHighAttention = attentionScore >= 50;
  const quadrant: QuadrantKey =
    isLowScore &&  isHighAttention ? 'priority' :
    !isLowScore && isHighAttention ? 'watch'    :
    isLowScore && !isHighAttention ? 'coaching' :
    'on_track';

  return {
    companyId:             input.companyId,
    companyName:           input.companyName,
    attentionScore,
    velocity,
    consistency,
    targetAttainment,
    completeness,
    quadrant,
    currentScore:          input.currentScore,
    currentClassification: input.currentClassification,
    trend,
  };
}
