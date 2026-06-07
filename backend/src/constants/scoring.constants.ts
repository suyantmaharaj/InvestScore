// Scoring thresholds and weights — full values populated in a future prompt

export const SCORE_THRESHOLDS = {
  LOW:    { min: 1.0, max: 1.66 },
  MEDIUM: { min: 1.67, max: 2.33 },
  HIGH:   { min: 2.34, max: 3.0  },
} as const;

export const CLASSIFICATION_LABELS = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
} as const;
