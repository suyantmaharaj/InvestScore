// Sanlam Investments - Fixed Scoring Methodology
// DO NOT MODIFY - this is the immutable scoring engine configuration

export type ScoreLevel = 'Low' | 'Medium' | 'High';
export type SectorType =
  | 'financial_services'
  | 'infrastructure'
  | 'manufacturing'
  | 'housing'
  | 'ict'
  | 'retail'
  | 'logistics'
  | 'other';

export const SCORE_VALUES = {
  Low:    1,
  Medium: 2,
  High:   3,
} as const;

export const CLASSIFICATION_BANDS = [
  { min: 1.0, max: 1.5, label: 'Low'    as ScoreLevel },
  { min: 1.6, max: 2.3, label: 'Medium' as ScoreLevel },
  { min: 2.4, max: 3.0, label: 'High'   as ScoreLevel },
];

export const classifyScore = (score: number): ScoreLevel => {
  if (score <= 1.5) return 'Low';
  if (score <= 2.3) return 'Medium';
  return 'High';
};

// KPI weights per sector - must sum to 1.0 within each sector
export const SECTOR_WEIGHTS: Record<SectorType, Record<string, number>> = {

  financial_services: {
    total_employees:             0.04,
    youth_employees:             0.04,
    female_employees:            0.04,
    bbbee_rating:                0.06,
    black_ownership_pct:         0.06,
    black_female_ownership_pct:  0.04,
    black_board_pct:             0.04,
    procurement_black_owned_pct: 0.04,
    smes_funded:                 0.10,
    black_smes_funded_pct:       0.10,
    women_led_smes_funded_pct:   0.08,
    capital_deployed_smes:       0.10,
    jobs_supported_smes:         0.10,
    csi_spend:                   0.06,
    local_suppliers:             0.05,
    smes_in_supply_chain:        0.05,
    total_annual_revenue:        0.05,
    scope1_co2e:                 0.04,
    scope2_co2e:                 0.04,
    recycled_waste_pct:          0.03,
    procurement_women_owned_pct: 0.04,
  },

  manufacturing: {
    total_employees:             0.05,
    youth_employees:             0.05,
    female_employees:            0.05,
    bbbee_rating:                0.06,
    black_ownership_pct:         0.05,
    black_female_ownership_pct:  0.04,
    black_board_pct:             0.04,
    procurement_black_owned_pct: 0.04,
    units_produced:              0.07,
    manufacturing_revenue_pct:   0.06,
    local_raw_material_pct:      0.07,
    apprentices_supported:       0.07,
    scope1_co2e:                 0.06,
    scope2_co2e:                 0.06,
    recycled_waste_pct:          0.06,
    total_water_consumption:     0.05,
    electricity_consumption:     0.05,
    renewable_energy_utilised:   0.05,
    csi_spend:                   0.04,
    local_suppliers:             0.04,
    smes_in_supply_chain:        0.04,
  },

  ict: {
    total_employees:             0.05,
    youth_employees:             0.06,
    female_employees:            0.05,
    bbbee_rating:                0.06,
    black_ownership_pct:         0.06,
    black_female_ownership_pct:  0.04,
    black_board_pct:             0.04,
    procurement_black_owned_pct: 0.04,
    spectrum_units:              0.08,
    new_customers_connected:     0.10,
    geographic_coverage_km2:     0.08,
    average_cost_of_service:     0.08,
    scope1_co2e:                 0.05,
    scope2_co2e:                 0.05,
    electricity_consumption:     0.05,
    renewable_energy_utilised:   0.05,
    csi_spend:                   0.04,
    local_suppliers:             0.04,
    smes_in_supply_chain:        0.04,
    total_annual_revenue:        0.04,
  },

  housing: {
    total_employees:             0.04,
    youth_employees:             0.04,
    female_employees:            0.04,
    bbbee_rating:                0.07,
    black_ownership_pct:         0.07,
    black_female_ownership_pct:  0.05,
    black_board_pct:             0.05,
    procurement_black_owned_pct: 0.05,
    affordable_houses:           0.12,
    social_housing_rental_avg:   0.08,
    social_housing_units:        0.10,
    csi_spend:                   0.05,
    local_suppliers:             0.05,
    smes_in_supply_chain:        0.05,
    scope1_co2e:                 0.04,
    scope2_co2e:                 0.04,
    recycled_waste_pct:          0.04,
    total_water_consumption:     0.04,
    procurement_women_owned_pct: 0.04,
    total_annual_revenue:        0.04,
  },

  infrastructure: {
    total_employees:             0.05,
    youth_employees:             0.05,
    female_employees:            0.04,
    bbbee_rating:                0.06,
    black_ownership_pct:         0.06,
    black_female_ownership_pct:  0.04,
    black_board_pct:             0.04,
    procurement_black_owned_pct: 0.05,
    scope1_co2e:                 0.07,
    scope2_co2e:                 0.07,
    recycled_waste_pct:          0.06,
    total_water_consumption:     0.06,
    electricity_consumption:     0.06,
    renewable_energy_utilised:   0.06,
    csi_spend:                   0.05,
    local_suppliers:             0.06,
    smes_in_supply_chain:        0.06,
    apprentices_supported:       0.05,
    procurement_women_owned_pct: 0.04,
    total_annual_revenue:        0.04,
  },

  retail: {
    total_employees:              0.05,
    youth_employees:              0.05,
    female_employees:             0.05,
    bbbee_rating:                 0.06,
    black_ownership_pct:          0.05,
    black_female_ownership_pct:   0.04,
    black_board_pct:              0.04,
    procurement_black_owned_pct:  0.05,
    products_local_producers_pct: 0.08,
    low_income_customers:         0.08,
    sustainable_products_pct:     0.07,
    scope1_co2e:                  0.05,
    scope2_co2e:                  0.05,
    recycled_waste_pct:           0.06,
    csi_spend:                    0.05,
    local_suppliers:              0.05,
    smes_in_supply_chain:         0.05,
    procurement_women_owned_pct:  0.04,
    total_annual_revenue:         0.04,
  },

  logistics: {
    total_employees:                0.05,
    youth_employees:                0.05,
    female_employees:               0.04,
    bbbee_rating:                   0.06,
    black_ownership_pct:            0.05,
    black_female_ownership_pct:     0.04,
    black_board_pct:                0.04,
    procurement_black_owned_pct:    0.05,
    port_pairs_routes:              0.08,
    road_rail_share_pct:            0.08,
    tonnage_passengers_transported: 0.08,
    scope1_co2e:                    0.07,
    scope2_co2e:                    0.07,
    recycled_waste_pct:             0.06,
    csi_spend:                      0.05,
    local_suppliers:                0.05,
    smes_in_supply_chain:           0.05,
    procurement_women_owned_pct:    0.04,
    total_annual_revenue:           0.04,
  },

  other: {
    total_employees:             0.07,
    youth_employees:             0.07,
    female_employees:            0.06,
    bbbee_rating:                0.08,
    black_ownership_pct:         0.07,
    black_female_ownership_pct:  0.06,
    black_board_pct:             0.06,
    procurement_black_owned_pct: 0.06,
    scope1_co2e:                 0.06,
    scope2_co2e:                 0.06,
    recycled_waste_pct:          0.06,
    csi_spend:                   0.06,
    local_suppliers:             0.06,
    smes_in_supply_chain:        0.06,
    procurement_women_owned_pct: 0.06,
    total_annual_revenue:        0.06,
  },
};

// KPI scoring thresholds - what constitutes Low / Medium / High performance
export const KPI_THRESHOLDS: Record<string, { low: number; high: number }> = {
  // Employment (higher = better)
  total_employees:            { low: 5,       high: 50       },
  youth_employees:            { low: 1,       high: 15       },
  management_employees:       { low: 1,       high: 10       },
  staff_employees:            { low: 3,       high: 40       },
  contractor_employees:       { low: 0,       high: 10       },
  female_employees:           { low: 1,       high: 10       },
  male_employees:             { low: 1,       high: 20       },
  black_employees:            { low: 1,       high: 20       },
  white_employees:            { low: 0,       high: 5        },
  coloured_employees:         { low: 0,       high: 5        },
  indian_employees:           { low: 0,       high: 5        },

  // Environmental - inverted where noted
  recycled_waste_pct:                 { low: 10,    high: 50    },
  scope1_co2e:                        { low: 500,   high: 100   }, // inverted
  scope2_co2e:                        { low: 500,   high: 100   }, // inverted
  renewable_energy_produced:          { low: 0,     high: 5000  },
  renewable_energy_utilised:          { low: 0,     high: 5000  },
  total_water_consumption:            { low: 5000,  high: 500   }, // inverted
  total_energy_consumption_renewable: { low: 0,     high: 5000  },
  electricity_consumption:            { low: 50000, high: 5000  }, // inverted

  // Transformation (higher = better, bbbee_rating inverted)
  bbbee_rating:               { low: 6,        high: 2        }, // inverted
  black_ownership_pct:        { low: 25,       high: 51       },
  black_female_ownership_pct: { low: 10,       high: 30       },
  black_board_pct:            { low: 25,       high: 51       },
  black_board_number:         { low: 1,        high: 3        },
  procurement_black_owned_pct:{ low: 30,       high: 60       },
  procurement_women_owned_pct:{ low: 10,       high: 30       },
  total_annual_revenue:       { low: 1000000,  high: 20000000 },

  // Community
  csi_spend:                  { low: 10000,  high: 200000 },
  local_suppliers:            { low: 3,      high: 15     },
  smes_in_supply_chain:       { low: 2,      high: 10     },

  // Financial services
  smes_funded:                { low: 1,      high: 10     },
  black_smes_funded_pct:      { low: 25,     high: 60     },
  women_led_smes_funded_pct:  { low: 10,     high: 30     },
  capital_deployed_smes:      { low: 500000, high: 5000000},
  jobs_supported_smes:        { low: 10,     high: 100    },

  // Manufacturing
  units_produced:             { low: 100,  high: 5000 },
  manufacturing_revenue_pct:  { low: 25,   high: 75   },
  local_raw_material_pct:     { low: 20,   high: 60   },
  apprentices_supported:      { low: 1,    high: 10   },

  // Retail
  products_local_producers_pct: { low: 10,  high: 40   },
  low_income_customers:         { low: 100, high: 2000 },
  sustainable_products_pct:     { low: 10,  high: 40   },

  // ICT
  spectrum_units:             { low: 10,  high: 100  },
  new_customers_connected:    { low: 100, high: 5000 },
  geographic_coverage_km2:    { low: 10,  high: 500  },
  average_cost_of_service:    { low: 500, high: 100  }, // inverted

  // Housing
  affordable_houses:          { low: 5,    high: 50   },
  social_housing_rental_avg:  { low: 5000, high: 1500 }, // inverted
  social_housing_units:       { low: 5,    high: 50   },

  // Water
  water_loss_reduction_pct:   { low: 5,   high: 20   },
  water_supplied_treated:     { low: 100, high: 5000 },
  water_connections:          { low: 10,  high: 500  },

  // Logistics
  port_pairs_routes:              { low: 1,   high: 10   },
  road_rail_share_pct:            { low: 30,  high: 70   },
  tonnage_passengers_transported: { low: 100, high: 5000 },
};

// KPIs where lower value = better (inverted scoring)
export const INVERTED_KPIS = new Set([
  'scope1_co2e',
  'scope2_co2e',
  'total_water_consumption',
  'electricity_consumption',
  'bbbee_rating',
  'average_cost_of_service',
  'social_housing_rental_avg',
]);

// Sector SDG averages derived from Sanlam 104+ portfolio data
// These represent realistic benchmarks for South African SMEs in each sector
export const SECTOR_SDG_AVERAGES: Record<string, Record<number, number>> = {
  financial_services: {
    1:  2.1,
    5:  2.3,
    8:  2.0,
    9:  2.1,
    10: 2.2,
    2: 1.8, 3: 1.8, 4: 1.8, 6: 1.8, 7: 1.8, 11: 1.9, 12: 1.8,
    13: 1.8, 14: 1.7, 15: 1.7, 16: 1.9, 17: 2.0,
  },
  manufacturing: {
    8:  2.3,
    9:  2.4,
    10: 2.5,
    7:  1.9,
    13: 1.9,
    1: 1.8, 2: 1.8, 3: 1.8, 4: 2.0, 5: 1.9, 6: 1.8, 11: 1.8, 12: 1.9,
    14: 1.7, 15: 1.8, 16: 2.0, 17: 1.9,
  },
  ict: {
    5:  2.1,
    7:  2.4,
    8:  2.2,
    10: 2.1,
    13: 2.3,
    1: 1.9, 2: 1.7, 3: 1.8, 4: 1.9, 6: 1.8, 9: 2.0, 11: 1.9, 12: 1.8,
    14: 1.7, 15: 1.7, 16: 1.9, 17: 1.9,
  },
  housing: {
    1:  2.2,
    4:  2.1,
    8:  2.1,
    10: 2.3,
    11: 2.4,
    13: 1.9,
    2: 1.7, 3: 1.8, 5: 2.0, 6: 1.8, 7: 1.8, 9: 1.9, 12: 1.9,
    14: 1.7, 15: 1.7, 16: 2.0, 17: 1.9,
  },
  infrastructure: {
    6:  2.2,
    7:  2.1,
    8:  2.0,
    9:  2.3,
    13: 2.1,
    1: 1.9, 2: 1.7, 3: 1.8, 4: 1.9, 5: 1.8, 10: 2.1, 11: 1.9, 12: 1.8,
    14: 1.8, 15: 1.8, 16: 1.9, 17: 1.9,
  },
  retail: {
    1:  2.0,
    4:  2.1,
    8:  2.2,
    10: 2.1,
    11: 1.9,
    2: 1.9, 3: 1.8, 5: 1.9, 6: 1.7, 7: 1.9, 9: 1.8, 12: 1.8,
    13: 1.8, 14: 1.7, 15: 1.7, 16: 1.9, 17: 1.9,
  },
  logistics: {
    8:  2.0,
    13: 1.9,
    1: 1.9, 2: 1.8, 3: 1.8, 4: 1.9, 5: 1.8, 6: 1.8, 7: 1.8, 9: 1.9,
    10: 2.0, 11: 1.9, 12: 1.8, 14: 1.7, 15: 1.7, 16: 1.9, 17: 1.9,
  },
  other: {
    1: 1.9, 2: 1.8, 3: 1.8, 4: 1.9, 5: 1.9, 6: 1.8, 7: 1.8, 8: 2.0,
    9: 1.9, 10: 2.0, 11: 1.9, 12: 1.8, 13: 1.8, 14: 1.7, 15: 1.7,
    16: 1.9, 17: 1.9,
  },
};
