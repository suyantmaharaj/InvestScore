import { KPI_DISPLAY_LIST } from './kpi-data';

const KPI_THRESHOLDS: Record<string, { low: number; medium: number; high: number; unit: string; inverted?: boolean }> = {
  total_employees:            { low: 5,       medium: 20,      high: 50,      unit: 'employees'  },
  youth_employees:            { low: 2,       medium: 8,       high: 20,      unit: 'employees'  },
  female_employees:           { low: 1,       medium: 5,       high: 15,      unit: 'employees'  },
  management_employees:       { low: 1,       medium: 3,       high: 8,       unit: 'employees'  },
  contractor_employees:       { low: 10,      medium: 5,       high: 0,       unit: 'contractors', inverted: true },
  scope1_co2e:                { low: 500,     medium: 200,     high: 50,      unit: 'tCO2e',     inverted: true },
  scope2_co2e:                { low: 500,     medium: 200,     high: 50,      unit: 'tCO2e',     inverted: true },
  electricity_consumption:    { low: 200000,  medium: 80000,   high: 20000,   unit: 'kWh',       inverted: true },
  renewable_energy_produced:  { low: 0,       medium: 5000,    high: 20000,   unit: 'kWh'        },
  renewable_energy_utilised:  { low: 0,       medium: 3000,    high: 10000,   unit: 'kWh'        },
  recycled_waste_pct:         { low: 5,       medium: 25,      high: 50,      unit: '%'          },
  total_water_consumption:    { low: 5000,    medium: 2000,    high: 500,     unit: 'kL',        inverted: true },
  bbbee_rating:               { low: 8,       medium: 4,       high: 1,       unit: 'level',     inverted: true },
  black_ownership_pct:        { low: 10,      medium: 25,      high: 51,      unit: '%'          },
  black_female_ownership_pct: { low: 0,       medium: 10,      high: 30,      unit: '%'          },
  black_board_pct:            { low: 20,      medium: 50,      high: 75,      unit: '%'          },
  procurement_black_owned_pct:{ low: 20,      medium: 40,      high: 60,      unit: '%'          },
  procurement_women_owned_pct:{ low: 5,       medium: 20,      high: 40,      unit: '%'          },
  csi_spend:                  { low: 0,       medium: 20000,   high: 100000,  unit: 'ZAR'        },
  local_suppliers:            { low: 2,       medium: 8,       high: 20,      unit: 'suppliers'  },
  smes_in_supply_chain:       { low: 1,       medium: 5,       high: 15,      unit: 'SMEs'       },
  smes_funded:                { low: 0,       medium: 5,       high: 20,      unit: 'SMEs'       },
  black_smes_funded_pct:      { low: 20,      medium: 50,      high: 70,      unit: '%'          },
  women_led_smes_funded_pct:  { low: 10,      medium: 30,      high: 50,      unit: '%'          },
  capital_deployed_smes:      { low: 0,       medium: 1000000, high: 5000000, unit: 'ZAR'        },
  jobs_supported_smes:        { low: 0,       medium: 20,      high: 100,     unit: 'jobs'       },
  apprentices_supported:      { low: 0,       medium: 3,       high: 8,       unit: 'apprentices'},
  local_raw_material_pct:     { low: 20,      medium: 50,      high: 80,      unit: '%'          },
  new_customers_connected:    { low: 100,     medium: 1000,    high: 5000,    unit: 'customers'  },
  affordable_houses:          { low: 5,       medium: 50,      high: 200,     unit: 'units'      },
};

export type TargetClassification = 'Medium' | 'High';

export interface KPIGap {
  kpiId:        string;
  label:        string;
  unit:         string;
  currentValue: number | null;
  targetValue:  number;
  change:       number;
  changeLabel:  string;
  effort:       'low' | 'medium' | 'high';
  effortLabel:  string;
  impact:       'primary' | 'secondary';
}

export interface GapAnalysisResult {
  sdgId:                 number;
  currentScore:          number;
  currentClassification: string;
  targetClassification:  TargetClassification;
  targetScore:           number;
  scoreDelta:            number;
  gaps:                  KPIGap[];
  totalEffortLabel:      string;
  feasibleThisQuarter:   boolean;
  summary:               string;
}

function getTargetScore(target: TargetClassification): number {
  return target === 'High' ? 2.4 : 1.6;
}

function getEffort(change: number, unit: string): 'low' | 'medium' | 'high' {
  if (unit === '%') {
    if (Math.abs(change) <= 10)  return 'low';
    if (Math.abs(change) <= 30)  return 'medium';
    return 'high';
  }
  if (unit === 'ZAR') {
    if (Math.abs(change) <= 50000)   return 'low';
    if (Math.abs(change) <= 500000)  return 'medium';
    return 'high';
  }
  if (unit === 'tCO2e') {
    if (Math.abs(change) <= 20)  return 'low';
    if (Math.abs(change) <= 100) return 'medium';
    return 'high';
  }
  if (unit === 'kWh') {
    if (Math.abs(change) <= 5000)  return 'low';
    if (Math.abs(change) <= 20000) return 'medium';
    return 'high';
  }
  if (Math.abs(change) <= 3)  return 'low';
  if (Math.abs(change) <= 10) return 'medium';
  return 'high';
}

function formatChange(change: number, unit: string, inverted?: boolean): string {
  const direction = inverted
    ? (change < 0 ? 'Reduce by' : 'Already at target')
    : (change > 0 ? 'Increase by' : 'Already at target');

  if (unit === 'ZAR')    return `${direction} R${Math.abs(change).toLocaleString('en-ZA')}`;
  if (unit === '%')      return `${direction} ${Math.abs(change)}%`;
  if (unit === 'level')  return change < 0 ? `Improve B-BBEE by ${Math.abs(change)} level${Math.abs(change) > 1 ? 's' : ''}` : 'Already at target';
  return `${direction} ${Math.abs(change)} ${unit}`;
}

export function calculateGaps(
  sdgId:                 number,
  currentScore:          number,
  currentClassification: string,
  target:                TargetClassification,
  submittedData:         Record<string, number | null>,
): GapAnalysisResult {
  const targetScore = getTargetScore(target);
  const scoreDelta  = targetScore - currentScore;
  const sdgKPIs     = KPI_DISPLAY_LIST.filter(k => k.sdgs.includes(sdgId));
  const gaps: KPIGap[] = [];

  for (const kpi of sdgKPIs) {
    const thresholds = KPI_THRESHOLDS[kpi.id];
    if (!thresholds) continue;

    const current    = submittedData[kpi.id];
    const { inverted } = thresholds;
    const needed     = target === 'High' ? thresholds.high : thresholds.medium;
    const currentVal = current ?? 0;

    const alreadyMet = inverted ? currentVal <= needed : currentVal >= needed;
    if (alreadyMet) continue;

    const change    = inverted ? needed - currentVal : needed - currentVal;
    const absChange = Math.abs(change);

    if (thresholds.unit === 'ZAR' && absChange < 1000) continue;
    if (thresholds.unit === '%'   && absChange < 1)    continue;
    if (thresholds.unit !== '%' && thresholds.unit !== 'ZAR' && absChange < 1) continue;

    const effort      = getEffort(change, thresholds.unit);
    const changeLabel = formatChange(change, thresholds.unit, inverted);
    const impact: 'primary' | 'secondary' = sdgKPIs.indexOf(kpi) < 2 ? 'primary' : 'secondary';

    gaps.push({
      kpiId:        kpi.id,
      label:        kpi.label,
      unit:         thresholds.unit,
      currentValue: current,
      targetValue:  needed,
      change:       inverted ? -absChange : absChange,
      changeLabel,
      effort,
      effortLabel:  effort === 'low' ? 'Quick win' : effort === 'medium' ? '~1 quarter' : 'Long-term',
      impact,
    });
  }

  gaps.sort((a, b) => {
    if (a.impact !== b.impact) return a.impact === 'primary' ? -1 : 1;
    const order = { low: 0, medium: 1, high: 2 };
    return order[a.effort] - order[b.effort];
  });

  const hardGaps           = gaps.filter(g => g.effort === 'high').length;
  const feasibleThisQuarter = hardGaps === 0 && gaps.length <= 5;

  const effortCounts = { low: 0, medium: 0, high: 0 };
  gaps.forEach(g => effortCounts[g.effort]++);

  const totalEffortLabel = gaps.length === 0
    ? 'No changes needed'
    : effortCounts.high > 0
      ? `${effortCounts.low + effortCounts.medium} quick/medium + ${effortCounts.high} long-term changes`
      : `${effortCounts.low} quick wins + ${effortCounts.medium} medium-effort changes`;

  const summary = gaps.length === 0
    ? `Your SDG ${sdgId} score is already at ${target} Impact. No changes needed.`
    : feasibleThisQuarter
      ? `To reach ${target} Impact on SDG ${sdgId}, focus on ${gaps.slice(0, 2).map(g => g.label).join(' and ')}. This is achievable within one quarter.`
      : `Reaching ${target} Impact on SDG ${sdgId} requires ${gaps.length} metric changes. Start with the quick wins and build toward the longer-term changes.`;

  return {
    sdgId,
    currentScore,
    currentClassification,
    targetClassification:  target,
    targetScore,
    scoreDelta,
    gaps,
    totalEffortLabel,
    feasibleThisQuarter,
    summary,
  };
}
