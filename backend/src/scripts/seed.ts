import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { calculateScore, calculateSDGScores } from '../services/scoring.service';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db        = admin.firestore();
const adminAuth = admin.auth();

// ============================================================
// DEMO USERS
// ============================================================

const DEMO_USERS = [
  { email: 'admin@investscore.co.za', password: 'Admin@2026!', role: 'admin', name: 'Sanlam Admin' },
  { email: 'pm@investscore.co.za',    password: 'PM@2026!',    role: 'pm',    name: 'Lerato Dlamini' },
  { email: 'sme1@investscore.co.za',  password: 'SME@2026!',   role: 'sme',   name: 'Sipho Nkosi',      companyId: 'company_001' },
  { email: 'sme2@investscore.co.za',  password: 'SME2@2026!',  role: 'sme',   name: 'Amahle Zulu',      companyId: 'company_002' },
  { email: 'sme3@investscore.co.za',  password: 'SME3@2026!',  role: 'sme',   name: 'Thabo Mokoena',    companyId: 'company_003' },
  { email: 'sme4@investscore.co.za',  password: 'SME4@2026!',  role: 'sme',   name: 'Nokwanda Dube',    companyId: 'company_004' },
  { email: 'sme5@investscore.co.za',  password: 'SME5@2026!',  role: 'sme',   name: 'Mandla Sithole',   companyId: 'company_005' },
  { email: 'sme6@investscore.co.za',  password: 'SME6@2026!',  role: 'sme',   name: 'Refilwe Moagi',    companyId: 'company_006' },
  { email: 'sme7@investscore.co.za',  password: 'SME7@2026!',  role: 'sme',   name: 'Tshepo Letsie',    companyId: 'company_007' },
  { email: 'sme8@investscore.co.za',  password: 'SME8@2026!',  role: 'sme',   name: 'Ziyanda Ntuli',    companyId: 'company_008' },
  { email: 'sme9@investscore.co.za',  password: 'SME9@2026!',  role: 'sme',   name: 'Lungelo Dlamini',  companyId: 'company_009' },
] as const;

// ============================================================
// DEMO COMPANIES (current / Q1 2026 data)
// ============================================================

const DEMO_COMPANIES = [

  // ─── COMPANY 1 - Khaya Capital ───────────────────────────────────────────
  {
    id:          'company_001',
    name:        'Khaya Capital',
    sector:      'financial_services',
    industry:    'SME Finance',
    location:    'Johannesburg, Gauteng',
    description: 'A Black-owned revenue-based finance provider delivering flexible, non-dilutive capital to high-growth South African SMEs. Focused on black-owned and women-led enterprises.',
    website:     'https://khayacapital.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    3,
    spokespersonName:  'Sipho Nkosi',
    spokespersonEmail: 'sme1@investscore.co.za',
    spokespersonTitle: 'CEO',
    status:      'active',
    mandate:     'Growth',
    bbbeeLevel:  4,
    kpiData: {
      total_employees:             18,
      youth_employees:              8,
      female_employees:            11,
      management_employees:         5,
      staff_employees:             13,
      contractor_employees:         0,
      black_employees:             14,
      white_employees:              4,
      coloured_employees:           0,
      indian_employees:             0,
      male_employees:               7,
      scope1_co2e:                 18,
      scope2_co2e:                 45,
      electricity_consumption:   9500,
      recycled_waste_pct:          28,
      renewable_energy_utilised:  800,
      renewable_energy_produced:    0,
      total_water_consumption:    180,
      bbbee_rating:                 4,
      black_ownership_pct:         25,
      black_female_ownership_pct:  10,
      black_board_pct:             40,
      black_board_number:           2,
      procurement_black_owned_pct: 60,
      procurement_women_owned_pct: 45,
      total_annual_revenue:   9500000,
      csi_spend:                45000,
      local_suppliers:              8,
      smes_in_supply_chain:         6,
      smes_funded:                 14,
      black_smes_funded_pct:       72,
      women_led_smes_funded_pct:   48,
      capital_deployed_smes:  3800000,
      jobs_supported_smes:         92,
    },
  },

  // ─── COMPANY 2 - Nkosi Manufacturing ──────────────────────────────────────
  {
    id:          'company_002',
    name:        'Nkosi Manufacturing',
    sector:      'manufacturing',
    industry:    'Electrical Equipment Manufacturing',
    location:    'Gauteng',
    description: 'A 100% Black woman-owned manufacturer of industrial-grade electrical transformers and distribution equipment. Serving municipalities, mining, and infrastructure projects nationwide.',
    website:     'https://nkosimfg.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Amahle Zulu',
    spokespersonEmail: 'sme2@investscore.co.za',
    spokespersonTitle: 'Managing Director',
    status:      'active',
    mandate:     'Growth',
    bbbeeLevel:  1,
    kpiData: {
      total_employees:          71,
      youth_employees:          18,
      female_employees:         15,
      management_employees:     11,
      staff_employees:          60,
      contractor_employees:      0,
      black_employees:          67,
      white_employees:           4,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           56,
      scope1_co2e:             280,
      scope2_co2e:             420,
      electricity_consumption: 185000,
      recycled_waste_pct:       38,
      renewable_energy_produced: 0,
      renewable_energy_utilised: 0,
      total_water_consumption: 2800,
      total_energy_consumption_renewable: 0,
      bbbee_rating:              1,
      black_ownership_pct:     100,
      black_female_ownership_pct: 100,
      black_board_pct:         100,
      black_board_number:        3,
      procurement_black_owned_pct: 72,
      procurement_women_owned_pct: 35,
      total_annual_revenue: 38000000,
      csi_spend:             95000,
      local_suppliers:          16,
      smes_in_supply_chain:     12,
      units_produced:        42000,
      manufacturing_revenue_pct: 98,
      local_raw_material_pct:   65,
      apprentices_supported:     9,
    },
  },

  // ─── COMPANY 3 - Tshiamo Tech ─────────────────────────────────────────────
  {
    id:          'company_003',
    name:        'Tshiamo Tech',
    sector:      'ict',
    industry:    'Clean Energy Technology',
    location:    'Johannesburg, Gauteng',
    description: 'A youth-led clean energy company delivering decentralised solar and battery storage solutions to South African households and SMEs. Reducing Eskom reliance through affordable renewable technology.',
    website:     'https://tshiamotech.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Thabo Mokoena',
    spokespersonEmail: 'sme3@investscore.co.za',
    spokespersonTitle: 'Founder & CTO',
    status:      'active',
    mandate:     'Growth',
    bbbeeLevel:  2,
    kpiData: {
      total_employees:          72,
      youth_employees:          52,
      female_employees:         32,
      management_employees:     29,
      staff_employees:          62,
      contractor_employees:     10,
      black_employees:          63,
      white_employees:           9,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           40,
      scope1_co2e:              28,
      scope2_co2e:              65,
      electricity_consumption: 22000,
      recycled_waste_pct:       25,
      renewable_energy_produced: 85000,
      renewable_energy_utilised: 12000,
      total_water_consumption:  450,
      total_energy_consumption_renewable: 12000,
      bbbee_rating:              2,
      black_ownership_pct:      65,
      black_female_ownership_pct: 22,
      black_board_pct:          80,
      black_board_number:        4,
      procurement_black_owned_pct: 68,
      procurement_women_owned_pct: 32,
      total_annual_revenue: 18500000,
      csi_spend:             62000,
      local_suppliers:          11,
      smes_in_supply_chain:      9,
      spectrum_units:            0,
      new_customers_connected: 2800,
      geographic_coverage_km2:  380,
      average_cost_of_service:  285,
    },
  },

  // ─── COMPANY 4 - Lungelo Housing ──────────────────────────────────────────
  {
    id:          'company_004',
    name:        'Lungelo Housing',
    sector:      'housing',
    industry:    'Affordable Housing Finance',
    location:    'Johannesburg, Gauteng',
    description: 'A Black-owned digital platform connecting first-time homebuyers to lenders. Making affordable housing finance accessible in township and peri-urban communities through technology.',
    website:     'https://lungelohousing.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    3,
    spokespersonName:  'Nokwanda Dube',
    spokespersonEmail: 'lungelo@lungelohousing.co.za',
    spokespersonTitle: 'Director',
    status:      'active',
    mandate:     'Growth',
    bbbeeLevel:  2,
    kpiData: {
      total_employees:          25,
      youth_employees:          14,
      female_employees:         17,
      management_employees:      6,
      staff_employees:          19,
      contractor_employees:      0,
      black_employees:          24,
      white_employees:           1,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:            8,
      scope1_co2e:               5,
      scope2_co2e:              18,
      electricity_consumption:  4200,
      recycled_waste_pct:       45,
      renewable_energy_utilised: 500,
      renewable_energy_produced:   0,
      total_water_consumption:  120,
      total_energy_consumption_renewable: 500,
      bbbee_rating:              2,
      black_ownership_pct:      63,
      black_female_ownership_pct: 28,
      black_board_pct:          75,
      black_board_number:        3,
      procurement_black_owned_pct: 82,
      procurement_women_owned_pct: 52,
      total_annual_revenue:  8800000,
      csi_spend:             38000,
      local_suppliers:           7,
      smes_in_supply_chain:      5,
      affordable_houses:        385,
      social_housing_rental_avg: 5800,
      social_housing_units:       12,
    },
  },

  // ─── COMPANY 5 - Ubuntu Logistics ─────────────────────────────────────────
  {
    id:          'company_005',
    name:        'Ubuntu Logistics',
    sector:      'logistics',
    industry:    'Freight & Last-Mile Distribution',
    location:    'Pretoria, Gauteng',
    description: 'A Black-owned logistics company specialising in last-mile delivery and supply chain solutions for South African SMEs and municipalities.',
    website:     'https://ubuntulogistics.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Mandla Sithole',
    spokespersonEmail: 'mandla@ubuntulogistics.co.za',
    spokespersonTitle: 'CEO',
    status:      'active',
    mandate:     'Empowerment',
    bbbeeLevel:  2,
    kpiData: {
      total_employees:          48,
      youth_employees:          20,
      female_employees:         14,
      management_employees:      8,
      staff_employees:          40,
      contractor_employees:      5,
      black_employees:          44,
      white_employees:           4,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           34,
      bbbee_rating:              2,
      black_ownership_pct:      85,
      black_female_ownership_pct: 18,
      black_board_pct:          75,
      black_board_number:        3,
      procurement_black_owned_pct: 68,
      procurement_women_owned_pct: 22,
      total_annual_revenue: 22000000,
      scope1_co2e:             720,
      scope2_co2e:              85,
      electricity_consumption: 18000,
      recycled_waste_pct:       20,
      csi_spend:             58000,
      local_suppliers:          14,
      smes_in_supply_chain:      9,
      port_pairs_routes:         7,
      road_rail_share_pct:      88,
      tonnage_passengers_transported: 3800,
      renewable_energy_utilised:   0,
      renewable_energy_produced:   0,
      total_water_consumption:   680,
    },
  },

  // ─── COMPANY 6 - Siyanda Retail Group ─────────────────────────────────────
  {
    id:          'company_006',
    name:        'Siyanda Retail Group',
    sector:      'retail',
    industry:    'Food Manufacturing & Retail',
    location:    'East London, Eastern Cape',
    description: 'A proudly South African food manufacturing and retail business under new Black ownership. Producing affordable, ready-to-eat products for rural and urban markets across the Eastern Cape and Western Cape.',
    website:     'https://siyanda.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Refilwe Moagi',
    spokespersonEmail: 'refilwe@siyanda.co.za',
    spokespersonTitle: 'Managing Director',
    status:      'active',
    mandate:     'Empowerment',
    bbbeeLevel:  2,
    kpiData: {
      total_employees:         108,
      youth_employees:          38,
      female_employees:         42,
      management_employees:     18,
      staff_employees:          90,
      contractor_employees:      8,
      black_employees:          98,
      white_employees:          10,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           66,
      scope1_co2e:             185,
      scope2_co2e:             320,
      electricity_consumption: 145000,
      recycled_waste_pct:       32,
      renewable_energy_produced: 28000,
      renewable_energy_utilised: 25000,
      total_water_consumption:  3200,
      total_energy_consumption_renewable: 25000,
      bbbee_rating:              2,
      black_ownership_pct:      65,
      black_female_ownership_pct: 30,
      black_board_pct:          60,
      black_board_number:        3,
      procurement_black_owned_pct: 55,
      procurement_women_owned_pct: 38,
      total_annual_revenue: 128000000,
      csi_spend:             185000,
      local_suppliers:          24,
      smes_in_supply_chain:     18,
      products_local_producers_pct: 72,
      low_income_customers:     42000,
      sustainable_products_pct:   18,
    },
  },

  // ─── COMPANY 7 - Amanzi Water Solutions ───────────────────────────────────
  {
    id:          'company_007',
    name:        'Amanzi Water Solutions',
    sector:      'infrastructure',
    industry:    'Clean Energy & Water Infrastructure',
    location:    'Bloemfontein, Free State',
    description: 'A 61% youth Black-owned clean infrastructure company designing and assembling battery energy storage systems and water infrastructure solutions for municipalities and off-grid communities in South Africa.',
    website:     'https://amanziwater.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    3,
    spokespersonName:  'Tshepo Letsie',
    spokespersonEmail: 'tshepo@amanziwater.co.za',
    spokespersonTitle: 'CEO',
    status:      'active',
    mandate:     'Empowerment',
    bbbeeLevel:  2,
    kpiData: {
      total_employees:          32,
      youth_employees:          22,
      female_employees:         14,
      management_employees:     10,
      staff_employees:          22,
      contractor_employees:      4,
      black_employees:          28,
      white_employees:           4,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           18,
      scope1_co2e:              22,
      scope2_co2e:              48,
      electricity_consumption: 16000,
      recycled_waste_pct:       55,
      renewable_energy_produced:  0,
      renewable_energy_utilised: 4500,
      total_water_consumption:   820,
      total_energy_consumption_renewable: 4500,
      bbbee_rating:              2,
      black_ownership_pct:      85,
      black_female_ownership_pct: 24,
      black_board_pct:          80,
      black_board_number:        4,
      procurement_black_owned_pct: 70,
      procurement_women_owned_pct: 30,
      total_annual_revenue:  9200000,
      csi_spend:             42000,
      local_suppliers:          10,
      smes_in_supply_chain:      8,
      water_loss_reduction_pct:  12,
      water_supplied_treated:   2800,
      water_connections:         145,
      apprentices_supported:       7,
    },
  },

  // ─── COMPANY 8 - Ziyanda Agri Co ──────────────────────────────────────────
  {
    id:          'company_008',
    name:        'Ziyanda Agri Co',
    sector:      'manufacturing',
    industry:    'Agri-Processing',
    location:    'George, Western Cape',
    description: 'A women-led agri-processing company converting locally-sourced produce into premium export-ready goods. Supporting smallholder farmers across the Western Cape.',
    website:     'https://ziyandaagri.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Ziyanda Ntuli',
    spokespersonEmail: 'ziyanda@ziyandaagri.co.za',
    spokespersonTitle: 'Founder',
    status:      'active',
    mandate:     'Empowerment',
    bbbeeLevel:  1,
    kpiData: {
      total_employees:          38,
      youth_employees:          18,
      female_employees:         26,
      management_employees:      8,
      staff_employees:          30,
      contractor_employees:      4,
      black_employees:          35,
      white_employees:           3,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:           12,
      bbbee_rating:              1,
      black_ownership_pct:      88,
      black_female_ownership_pct: 72,
      black_board_pct:         100,
      black_board_number:        3,
      procurement_black_owned_pct: 78,
      procurement_women_owned_pct: 62,
      total_annual_revenue:  8200000,
      units_produced:          480000,
      manufacturing_revenue_pct: 92,
      local_raw_material_pct:    88,
      apprentices_supported:      6,
      scope1_co2e:             105,
      scope2_co2e:             195,
      recycled_waste_pct:        68,
      total_water_consumption:  1950,
      electricity_consumption: 28000,
      renewable_energy_utilised: 9500,
      renewable_energy_produced: 10200,
      total_energy_consumption_renewable: 9500,
      csi_spend:              72000,
      local_suppliers:           18,
      smes_in_supply_chain:      14,
    },
  },

  // ─── COMPANY 9 - Ithemba Digital ──────────────────────────────────────────
  {
    id:          'company_009',
    name:        'Ithemba Digital',
    sector:      'ict',
    industry:    'EdTech & Digital Inclusion',
    location:    'Soweto, Gauteng',
    description: 'A youth-led EdTech company building offline-first digital learning tools for township schools. Increasing Black representation in technology through community mentorship and skills development.',
    website:     'https://ithembadigital.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth:    2,
    spokespersonName:  'Lungelo Dlamini',
    spokespersonEmail: 'lungelo@ithembadigital.co.za',
    spokespersonTitle: 'CEO',
    status:      'active',
    mandate:     'Empowerment',
    bbbeeLevel:  1,
    kpiData: {
      total_employees:          14,
      youth_employees:          12,
      female_employees:          7,
      management_employees:      4,
      staff_employees:          10,
      contractor_employees:      2,
      black_employees:          14,
      white_employees:           0,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:            7,
      bbbee_rating:              1,
      black_ownership_pct:     100,
      black_female_ownership_pct: 45,
      black_board_pct:         100,
      black_board_number:        3,
      procurement_black_owned_pct: 85,
      procurement_women_owned_pct: 48,
      total_annual_revenue:  2400000,
      new_customers_connected: 11500,
      geographic_coverage_km2:  120,
      average_cost_of_service:   42,
      scope1_co2e:               6,
      scope2_co2e:              14,
      recycled_waste_pct:        18,
      electricity_consumption:  3200,
      renewable_energy_utilised:  650,
      renewable_energy_produced:    0,
      total_water_consumption:    95,
      csi_spend:              22000,
      local_suppliers:            5,
      smes_in_supply_chain:       4,
    },
  },
];

// ============================================================
// HISTORICAL KPI DATA (Q1–Q4 2025)
// Shows realistic improvement over time for the 3 SME logins
// ============================================================

// Dates: months ago from "now" (we use fixed offsets for reproducibility)
// Q1 2025 = ~15 months ago, Q2 = ~12, Q3 = ~9, Q4 = ~6
function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const HISTORICAL_PERIODS = [
  { period: 'Q1 2025', submittedDaysAgo: 455, scoredDaysAgo: 448 },
  { period: 'Q2 2025', submittedDaysAgo: 365, scoredDaysAgo: 358 },
  { period: 'Q3 2025', submittedDaysAgo: 275, scoredDaysAgo: 268 },
  { period: 'Q4 2025', submittedDaysAgo: 185, scoredDaysAgo: 178 },
];

// Khaya Capital (company_001 / financial_services) historical KPI data
// Trend: steady growth in SME funding reach and transformation metrics
const KHAYA_HISTORICAL_KPIS = [
  // Q1 2025 — early stage, lower impact
  {
    total_employees: 12, youth_employees: 5, female_employees: 7, management_employees: 3,
    staff_employees: 9, contractor_employees: 0, black_employees: 9, white_employees: 3,
    coloured_employees: 0, indian_employees: 0, male_employees: 5,
    scope1_co2e: 24, scope2_co2e: 62, electricity_consumption: 12000,
    recycled_waste_pct: 14, renewable_energy_utilised: 200, renewable_energy_produced: 0,
    total_water_consumption: 240,
    bbbee_rating: 5, black_ownership_pct: 20, black_female_ownership_pct: 8,
    black_board_pct: 33, black_board_number: 1,
    procurement_black_owned_pct: 38, procurement_women_owned_pct: 25,
    total_annual_revenue: 4800000, csi_spend: 15000,
    local_suppliers: 4, smes_in_supply_chain: 3,
    smes_funded: 5, black_smes_funded_pct: 52, women_led_smes_funded_pct: 30,
    capital_deployed_smes: 1200000, jobs_supported_smes: 22,
  },
  // Q2 2025
  {
    total_employees: 14, youth_employees: 6, female_employees: 9, management_employees: 4,
    staff_employees: 10, contractor_employees: 0, black_employees: 11, white_employees: 3,
    coloured_employees: 0, indian_employees: 0, male_employees: 5,
    scope1_co2e: 22, scope2_co2e: 55, electricity_consumption: 10800,
    recycled_waste_pct: 18, renewable_energy_utilised: 380, renewable_energy_produced: 0,
    total_water_consumption: 210,
    bbbee_rating: 5, black_ownership_pct: 22, black_female_ownership_pct: 9,
    black_board_pct: 33, black_board_number: 1,
    procurement_black_owned_pct: 44, procurement_women_owned_pct: 32,
    total_annual_revenue: 6200000, csi_spend: 24000,
    local_suppliers: 5, smes_in_supply_chain: 4,
    smes_funded: 7, black_smes_funded_pct: 60, women_led_smes_funded_pct: 36,
    capital_deployed_smes: 1900000, jobs_supported_smes: 42,
  },
  // Q3 2025
  {
    total_employees: 16, youth_employees: 7, female_employees: 10, management_employees: 4,
    staff_employees: 12, contractor_employees: 0, black_employees: 12, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 6,
    scope1_co2e: 20, scope2_co2e: 50, electricity_consumption: 10200,
    recycled_waste_pct: 22, renewable_energy_utilised: 580, renewable_energy_produced: 0,
    total_water_consumption: 195,
    bbbee_rating: 4, black_ownership_pct: 24, black_female_ownership_pct: 10,
    black_board_pct: 40, black_board_number: 2,
    procurement_black_owned_pct: 52, procurement_women_owned_pct: 38,
    total_annual_revenue: 7600000, csi_spend: 34000,
    local_suppliers: 7, smes_in_supply_chain: 5,
    smes_funded: 10, black_smes_funded_pct: 65, women_led_smes_funded_pct: 42,
    capital_deployed_smes: 2700000, jobs_supported_smes: 64,
  },
  // Q4 2025
  {
    total_employees: 17, youth_employees: 7, female_employees: 10, management_employees: 5,
    staff_employees: 12, contractor_employees: 0, black_employees: 13, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 7,
    scope1_co2e: 19, scope2_co2e: 47, electricity_consumption: 9700,
    recycled_waste_pct: 25, renewable_energy_utilised: 720, renewable_energy_produced: 0,
    total_water_consumption: 185,
    bbbee_rating: 4, black_ownership_pct: 25, black_female_ownership_pct: 10,
    black_board_pct: 40, black_board_number: 2,
    procurement_black_owned_pct: 57, procurement_women_owned_pct: 43,
    total_annual_revenue: 8700000, csi_spend: 40000,
    local_suppliers: 8, smes_in_supply_chain: 6,
    smes_funded: 12, black_smes_funded_pct: 70, women_led_smes_funded_pct: 46,
    capital_deployed_smes: 3300000, jobs_supported_smes: 80,
  },
];

// Nkosi Manufacturing (company_002 / manufacturing) historical KPI data
// Trend: increasing production, improving emissions, growing workforce
const NKOSI_HISTORICAL_KPIS = [
  // Q1 2025
  {
    total_employees: 54, youth_employees: 12, female_employees: 11, management_employees: 8,
    staff_employees: 46, contractor_employees: 0, black_employees: 50, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 43,
    scope1_co2e: 350, scope2_co2e: 530, electricity_consumption: 215000,
    recycled_waste_pct: 20, renewable_energy_produced: 0, renewable_energy_utilised: 0,
    total_water_consumption: 3400, total_energy_consumption_renewable: 0,
    bbbee_rating: 2, black_ownership_pct: 100, black_female_ownership_pct: 100,
    black_board_pct: 100, black_board_number: 3,
    procurement_black_owned_pct: 60, procurement_women_owned_pct: 28,
    total_annual_revenue: 26000000, csi_spend: 60000,
    local_suppliers: 12, smes_in_supply_chain: 8,
    units_produced: 28000, manufacturing_revenue_pct: 95, local_raw_material_pct: 50,
    apprentices_supported: 4,
  },
  // Q2 2025
  {
    total_employees: 60, youth_employees: 14, female_employees: 13, management_employees: 9,
    staff_employees: 51, contractor_employees: 0, black_employees: 56, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 47,
    scope1_co2e: 315, scope2_co2e: 488, electricity_consumption: 202000,
    recycled_waste_pct: 26, renewable_energy_produced: 0, renewable_energy_utilised: 0,
    total_water_consumption: 3150, total_energy_consumption_renewable: 0,
    bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 100,
    black_board_pct: 100, black_board_number: 3,
    procurement_black_owned_pct: 64, procurement_women_owned_pct: 30,
    total_annual_revenue: 30000000, csi_spend: 76000,
    local_suppliers: 14, smes_in_supply_chain: 10,
    units_produced: 34000, manufacturing_revenue_pct: 97, local_raw_material_pct: 56,
    apprentices_supported: 6,
  },
  // Q3 2025
  {
    total_employees: 65, youth_employees: 16, female_employees: 14, management_employees: 10,
    staff_employees: 55, contractor_employees: 0, black_employees: 61, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 51,
    scope1_co2e: 295, scope2_co2e: 455, electricity_consumption: 193000,
    recycled_waste_pct: 32, renewable_energy_produced: 0, renewable_energy_utilised: 0,
    total_water_consumption: 2950, total_energy_consumption_renewable: 0,
    bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 100,
    black_board_pct: 100, black_board_number: 3,
    procurement_black_owned_pct: 68, procurement_women_owned_pct: 32,
    total_annual_revenue: 34000000, csi_spend: 85000,
    local_suppliers: 15, smes_in_supply_chain: 11,
    units_produced: 38000, manufacturing_revenue_pct: 97, local_raw_material_pct: 61,
    apprentices_supported: 7,
  },
  // Q4 2025
  {
    total_employees: 70, youth_employees: 17, female_employees: 15, management_employees: 11,
    staff_employees: 59, contractor_employees: 0, black_employees: 66, white_employees: 4,
    coloured_employees: 0, indian_employees: 0, male_employees: 55,
    scope1_co2e: 285, scope2_co2e: 432, electricity_consumption: 189000,
    recycled_waste_pct: 36, renewable_energy_produced: 0, renewable_energy_utilised: 0,
    total_water_consumption: 2860, total_energy_consumption_renewable: 0,
    bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 100,
    black_board_pct: 100, black_board_number: 3,
    procurement_black_owned_pct: 70, procurement_women_owned_pct: 34,
    total_annual_revenue: 36500000, csi_spend: 90000,
    local_suppliers: 16, smes_in_supply_chain: 12,
    units_produced: 41000, manufacturing_revenue_pct: 98, local_raw_material_pct: 63,
    apprentices_supported: 8,
  },
];

// Tshiamo Tech (company_003 / ict) historical KPI data
// Trend: rapid customer growth, expanding coverage, improving affordability
const TSHIAMO_HISTORICAL_KPIS = [
  // Q1 2025
  {
    total_employees: 50, youth_employees: 36, female_employees: 22, management_employees: 17,
    staff_employees: 43, contractor_employees: 7, black_employees: 44, white_employees: 6,
    coloured_employees: 0, indian_employees: 0, male_employees: 28,
    scope1_co2e: 40, scope2_co2e: 95, electricity_consumption: 30000,
    recycled_waste_pct: 16, renewable_energy_produced: 38000, renewable_energy_utilised: 6500,
    total_water_consumption: 600, total_energy_consumption_renewable: 6500,
    bbbee_rating: 3, black_ownership_pct: 55, black_female_ownership_pct: 18,
    black_board_pct: 70, black_board_number: 3,
    procurement_black_owned_pct: 56, procurement_women_owned_pct: 24,
    total_annual_revenue: 11000000, csi_spend: 34000,
    local_suppliers: 7, smes_in_supply_chain: 6,
    spectrum_units: 0, new_customers_connected: 1100, geographic_coverage_km2: 160,
    average_cost_of_service: 420,
  },
  // Q2 2025
  {
    total_employees: 57, youth_employees: 41, female_employees: 25, management_employees: 21,
    staff_employees: 49, contractor_employees: 8, black_employees: 50, white_employees: 7,
    coloured_employees: 0, indian_employees: 0, male_employees: 32,
    scope1_co2e: 35, scope2_co2e: 80, electricity_consumption: 25500,
    recycled_waste_pct: 20, renewable_energy_produced: 55000, renewable_energy_utilised: 8800,
    total_water_consumption: 530, total_energy_consumption_renewable: 8800,
    bbbee_rating: 2, black_ownership_pct: 60, black_female_ownership_pct: 20,
    black_board_pct: 75, black_board_number: 3,
    procurement_black_owned_pct: 62, procurement_women_owned_pct: 27,
    total_annual_revenue: 13500000, csi_spend: 46000,
    local_suppliers: 9, smes_in_supply_chain: 7,
    spectrum_units: 0, new_customers_connected: 1700, geographic_coverage_km2: 235,
    average_cost_of_service: 360,
  },
  // Q3 2025
  {
    total_employees: 64, youth_employees: 46, female_employees: 28, management_employees: 25,
    staff_employees: 56, contractor_employees: 9, black_employees: 56, white_employees: 8,
    coloured_employees: 0, indian_employees: 0, male_employees: 36,
    scope1_co2e: 31, scope2_co2e: 72, electricity_consumption: 23000,
    recycled_waste_pct: 23, renewable_energy_produced: 70000, renewable_energy_utilised: 10500,
    total_water_consumption: 490, total_energy_consumption_renewable: 10500,
    bbbee_rating: 2, black_ownership_pct: 63, black_female_ownership_pct: 21,
    black_board_pct: 78, black_board_number: 4,
    procurement_black_owned_pct: 65, procurement_women_owned_pct: 30,
    total_annual_revenue: 16000000, csi_spend: 55000,
    local_suppliers: 10, smes_in_supply_chain: 8,
    spectrum_units: 0, new_customers_connected: 2200, geographic_coverage_km2: 305,
    average_cost_of_service: 318,
  },
  // Q4 2025
  {
    total_employees: 70, youth_employees: 50, female_employees: 31, management_employees: 28,
    staff_employees: 60, contractor_employees: 10, black_employees: 61, white_employees: 9,
    coloured_employees: 0, indian_employees: 0, male_employees: 39,
    scope1_co2e: 29, scope2_co2e: 68, electricity_consumption: 22500,
    recycled_waste_pct: 24, renewable_energy_produced: 80000, renewable_energy_utilised: 11500,
    total_water_consumption: 465, total_energy_consumption_renewable: 11500,
    bbbee_rating: 2, black_ownership_pct: 64, black_female_ownership_pct: 21,
    black_board_pct: 80, black_board_number: 4,
    procurement_black_owned_pct: 67, procurement_women_owned_pct: 31,
    total_annual_revenue: 17500000, csi_spend: 59000,
    local_suppliers: 11, smes_in_supply_chain: 9,
    spectrum_units: 0, new_customers_connected: 2600, geographic_coverage_km2: 355,
    average_cost_of_service: 298,
  },
];

// ============================================================
// NOTIFICATIONS (for PM and admin roles)
// ============================================================

const DEMO_NOTIFICATIONS = [
  {
    id: 'notif_001',
    type: 'submission',
    title: 'Q1 2026 impact report submitted — Khaya Capital',
    body: 'Sipho Nkosi submitted the Q1 2026 impact report for Khaya Capital. 14 SMEs funded, R3.8M capital deployed. Score is now available.',
    companyId: 'company_001', companyName: 'Khaya Capital',
    severity: 'info', forRole: 'pm', read: false,
    createdAt: daysAgoISO(7),
  },
  {
    id: 'notif_002',
    type: 'classification_change',
    title: 'Khaya Capital — SDG 8 Employment improved to Medium',
    body: "Khaya Capital's SDG 8 (Decent Work & Economic Growth) score improved from Low to Medium following the Q4 2025 submission. Headcount grew from 12 to 17 employees over the year.",
    companyId: 'company_001', companyName: 'Khaya Capital',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(14),
    readAt: daysAgoISO(13),
  },
  {
    id: 'notif_003',
    type: 'submission',
    title: 'Q1 2026 impact report submitted — Nkosi Manufacturing',
    body: 'Amahle Zulu submitted the Q1 2026 impact report for Nkosi Manufacturing. 71 employees, Level 1 B-BBEE, 9 apprentices supported.',
    companyId: 'company_002', companyName: 'Nkosi Manufacturing',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(8),
    readAt: daysAgoISO(7),
  },
  {
    id: 'notif_004',
    type: 'submission',
    title: 'Q1 2026 impact report submitted — Tshiamo Tech',
    body: 'Thabo Mokoena submitted the Q1 2026 impact report for Tshiamo Tech. 2,800 new solar customers connected, 380 km² coverage.',
    companyId: 'company_003', companyName: 'Tshiamo Tech',
    severity: 'info', forRole: 'pm', read: false,
    createdAt: daysAgoISO(5),
  },
  {
    id: 'notif_005',
    type: 'risk_alert',
    title: 'Ubuntu Logistics — SDG 13 Climate score critically low',
    body: 'Ubuntu Logistics has a critically low SDG 13 (Climate Action) score driven by high Scope 1 fleet emissions (720 tCO2e). Immediate portfolio review recommended.',
    companyId: 'company_005', companyName: 'Ubuntu Logistics',
    severity: 'critical', forRole: 'pm', read: false,
    createdAt: daysAgoISO(3),
  },
  {
    id: 'notif_006',
    type: 'risk_alert',
    title: 'Siyanda Retail Group — Q1 2026 report overdue',
    body: 'Siyanda Retail Group has not yet submitted their Q1 2026 impact report. The reporting window closed 3 days ago. Please follow up with Refilwe Moagi.',
    companyId: 'company_006', companyName: 'Siyanda Retail Group',
    severity: 'warning', forRole: 'pm', read: false,
    createdAt: daysAgoISO(2),
  },
  {
    id: 'notif_007',
    type: 'registration_approved',
    title: 'New company onboarded — Amanzi Water Solutions',
    body: 'Admin approved Tshepo Letsie\'s registration for Amanzi Water Solutions (infrastructure sector). The company has been added to your portfolio.',
    companyId: 'company_007', companyName: 'Amanzi Water Solutions',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(21),
    readAt: daysAgoISO(20),
  },
  {
    id: 'notif_008',
    type: 'classification_change',
    title: 'Nkosi Manufacturing — Overall classification upgraded to High',
    body: 'Following Q4 2025 review, Nkosi Manufacturing\'s overall SDG classification has been updated to High. Strong B-BBEE Level 1 status, 94% black employment, and 9 active apprentices.',
    companyId: 'company_002', companyName: 'Nkosi Manufacturing',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(15),
    readAt: daysAgoISO(14),
  },
  {
    id: 'notif_009',
    type: 'risk_alert',
    title: 'Ithemba Digital — SDG 12 below ICT sector average',
    body: 'Ithemba Digital\'s SDG 12 (Responsible Consumption) score is significantly below the ICT sector average. Recycled waste at 18% vs sector benchmark of 35%. Recommend reviewing waste management practices.',
    companyId: 'company_009', companyName: 'Ithemba Digital',
    severity: 'warning', forRole: 'pm', read: false,
    createdAt: daysAgoISO(1),
  },
  {
    id: 'notif_010',
    type: 'submission',
    title: 'Q4 2025 impact report submitted — Khaya Capital',
    body: "Sipho Nkosi submitted Khaya Capital's Q4 2025 impact report. Score improved from 1.85 to 2.04 — now classified as Medium. 12 SMEs funded, R3.3M capital deployed in Q4.",
    companyId: 'company_001', companyName: 'Khaya Capital',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(95),
    readAt: daysAgoISO(94),
  },
  {
    id: 'notif_011',
    type: 'registration_approved',
    title: 'New company onboarded — Lungelo Housing',
    body: 'Admin approved Nokwanda Dube\'s registration for Lungelo Housing (housing sector, 385 affordable units). Added to your portfolio.',
    companyId: 'company_004', companyName: 'Lungelo Housing',
    severity: 'info', forRole: 'pm', read: true,
    createdAt: daysAgoISO(60),
    readAt: daysAgoISO(59),
  },
  {
    id: 'notif_012',
    type: 'risk_alert',
    title: 'Ziyanda Agri Co — No Q4 2025 submission yet',
    body: 'Ziyanda Agri Co has not yet submitted their Q4 2025 report. 45-day overdue. Please contact Ziyanda Ntuli to ensure data is captured before the Q1 2026 window opens.',
    companyId: 'company_008', companyName: 'Ziyanda Agri Co',
    severity: 'warning', forRole: 'admin', read: false,
    createdAt: daysAgoISO(45),
  },
];

// ============================================================
// PM TARGETS (PM-set SDG targets per company)
// ============================================================

const DEMO_TARGETS = [
  {
    companyId: 'company_001',
    targets: { '1': 2.5, '5': 2.4, '8': 2.5, '10': 2.4, '13': 2.2, '17': 2.5 },
  },
  {
    companyId: 'company_002',
    targets: { '4': 2.5, '8': 2.8, '9': 2.5, '10': 2.8, '13': 2.2, '12': 2.0 },
  },
  {
    companyId: 'company_003',
    targets: { '7': 2.8, '8': 2.5, '9': 2.6, '13': 2.5, '10': 2.3 },
  },
  {
    companyId: 'company_004',
    targets: { '1': 2.6, '8': 2.3, '10': 2.5, '11': 2.8 },
  },
  {
    companyId: 'company_005',
    targets: { '8': 2.2, '9': 2.3, '13': 2.0 },
  },
  {
    companyId: 'company_007',
    targets: { '6': 2.5, '7': 2.5, '9': 2.5, '13': 2.3 },
  },
];

// ============================================================
// PM ENGAGEMENT LOGS
// ============================================================

const DEMO_ENGAGEMENT = [
  // Khaya Capital — 3 engagements
  {
    companyId: 'company_001',
    type: 'Call',
    date: daysAgoISO(7).split('T')[0],
    notes: 'Q1 2026 submission review call with Sipho. Discussed strong growth in SME funding reach — 14 funded vs 12 last quarter. Sipho targeting 20 SMEs by Q3 2026. B-BBEE Level 3 upgrade is on track for year-end. Noted procurement from women-owned suppliers hit 45% — above the 40% target.',
    commitments: [
      'Sipho to submit updated B-BBEE verification certificate by 30 June 2026',
      'PM to share financial services sector benchmarking report',
      'Both to review SDG 5 targets for Q2 2026',
    ],
    createdAt: daysAgoISO(7),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },
  {
    companyId: 'company_001',
    type: 'Site Visit',
    date: daysAgoISO(48).split('T')[0],
    notes: 'Visited Khaya Capital\'s Sandton office. Team of 16 at the time. Reviewed their loan book — strong pipeline of Black female-owned businesses. Discussed potential to add impact tracking fields for funded SMEs (SDG outcomes data). Office has LED lighting and no single-use plastics policy — good baseline for SDG 13.',
    commitments: [
      'Khaya Capital to track and report employment outcomes within funded SME cohort for Q3 2025',
      'PM to connect Khaya Capital with Tshiamo Tech regarding office solar installation',
    ],
    createdAt: daysAgoISO(48),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },
  {
    companyId: 'company_001',
    type: 'Email',
    date: daysAgoISO(125).split('T')[0],
    notes: 'Welcome email and onboarding note to Sipho following Q2 2025 submission. Shared the scoring methodology overview and explained the difference between Medium and High classification thresholds. Highlighted that increasing capital deployed above R5M would push SDG 1 to High.',
    commitments: [
      'Sipho to review SDG 1 improvement actions document shared by PM',
    ],
    createdAt: daysAgoISO(125),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },

  // Nkosi Manufacturing — 2 engagements
  {
    companyId: 'company_002',
    type: 'Call',
    date: daysAgoISO(10).split('T')[0],
    notes: 'Post-submission call for Q1 2026. Amahle confirmed all data is accurate. 9 apprentices currently in programme — targeting 12 by year end. Discussed high electricity consumption (185,000 kWh) vs sector average. Recommended investigating rooftop solar PV. Local raw material sourcing at 65% — on track for 70% target.',
    commitments: [
      'Amahle to get solar feasibility quote from 2 accredited installers by end of July 2026',
      'PM to share infrastructure sector solar financing case studies',
    ],
    createdAt: daysAgoISO(10),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },
  {
    companyId: 'company_002',
    type: 'Call',
    date: daysAgoISO(58).split('T')[0],
    notes: 'Quarterly review after Q4 2025 submission. Celebrated B-BBEE Level 1 achievement — now held for 2 consecutive periods. Recycled waste at 36% — above 30% target. Discussed adding renewable energy utilisation target for 2026. Revenue growth from R26M to R36M over the year is exceptional.',
    commitments: [
      'Amahle to document current waste management process for SDG 12 reporting',
      'Both to set renewable energy utilisation target for FY 2027',
    ],
    createdAt: daysAgoISO(58),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },

  // Tshiamo Tech — 2 engagements
  {
    companyId: 'company_003',
    type: 'Call',
    date: daysAgoISO(5).split('T')[0],
    notes: 'Q1 2026 review call with Thabo. Strong numbers — 2,800 new customers connected, 380 km² coverage. Youth employment at 72% is sector-leading. Discussed the average cost of service (R285/month) — target is R250 to improve SDG 9 affordability score. Discussed bulk installation model as a potential cost lever.',
    commitments: [
      'Thabo to model bulk installation pricing scenarios to reduce per-unit cost to below R250',
      'PM to review ICT affordability benchmarking data and share with Thabo',
    ],
    createdAt: daysAgoISO(5),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },
  {
    companyId: 'company_003',
    type: 'Site Visit',
    date: daysAgoISO(120).split('T')[0],
    notes: 'Visited Tshiamo Tech warehouse in Johannesburg South. Inspected solar assembly line — impressive operations for a 4-year-old company. 85,000 kWh of renewable energy produced is a significant SDG 7 contribution. Team is mostly under 35 — a genuine youth employment story. Discussed plans to expand to KZN.',
    commitments: [
      'Thabo to document KZN expansion plan including employment projections for Q3 2025 submission',
      'PM to share renewable energy sector sector-average benchmarks for SDG 7 and 13',
    ],
    createdAt: daysAgoISO(120),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },

  // Lungelo Housing — 1 engagement
  {
    companyId: 'company_004',
    type: 'Call',
    date: daysAgoISO(30).split('T')[0],
    notes: 'Welcome onboarding call with Nokwanda. Discussed the platform model — digital mortgage matching for first-time homebuyers. 385 affordable units facilitated. Reviewed the SDG 11 (Sustainable Cities) importance for housing sector companies. Affordable housing rental average of R5,800 is close to the scoring threshold.',
    commitments: [
      'Nokwanda to document the affordability methodology and average rental data for next submission',
      'PM to share housing sector SDG 11 benchmarking data',
    ],
    createdAt: daysAgoISO(30),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },

  // Amanzi Water Solutions — 1 engagement
  {
    companyId: 'company_007',
    type: 'Call',
    date: daysAgoISO(18).split('T')[0],
    notes: 'Onboarding call with Tshepo post-registration approval. Reviewed the company profile — 61% youth ownership is impressive. 145 water connections and 2,800 kL supplied to date. Discussed the importance of water loss reduction (currently 12%) for SDG 6 scoring. Battery energy storage systems align strongly with SDG 7.',
    commitments: [
      'Tshepo to provide first full submission by end of June 2026',
      'PM to set SDG 6 and 7 targets before first submission',
    ],
    createdAt: daysAgoISO(18),
    createdBy: 'pm@investscore.co.za',
    pmUid: 'pm_uid_placeholder',
  },
];

// ============================================================
// AI CONTEXT
// ============================================================

const AI_CONTEXT = {
  id: 'global',
  rules: [
    'Always refer to SDG scores as being calculated by the Sanlam proprietary methodology.',
    'Never suggest that an SME change their sector classification.',
    'When coaching on B-BBEE improvement, always refer to verified B-BBEE certificates.',
    'Tone should be encouraging and practical - never condescending.',
    'Always prioritise high-impact, low-cost improvements first.',
    'Reference South African context - use Rands, reference Eskom, B-BBEE, POPIA, SETA, NQF.',
    'Do not compare specific named companies against each other when coaching.',
    'Acknowledge the mandate context: Growth mandate companies should focus on scaling impact; Empowerment mandate companies should focus on transformation metrics.',
    'Employment transformation is the primary impact metric for the 104+ portfolio. Always reference employment outcomes when relevant.',
    'Youth employment (under 35) and female employment are priority metrics. Celebrate progress and suggest actionable improvements.',
  ],
  sectorNotes: {
    financial_services: 'Focus coaching on SME funding reach, Black ownership, capital deployment, and jobs supported through funded companies. Revenue-based financing and alternative capital are key innovations to support.',
    manufacturing:      'Prioritise local sourcing, apprenticeships, Black female ownership, and permanent employment. B-BBEE Level 1 is achievable and transformative in this sector.',
    ict:                'Focus on customer reach, affordability, youth employment, and renewable energy use. Clean energy displacement of diesel and grid power is a key SDG 7 and 13 lever.',
    housing:            'Prioritise affordability metrics, female employment, and Black ownership. Digital models that reduce paper and carbon are SDG 13 contributors.',
    infrastructure:     'Focus on water access, clean energy storage, local manufacturing, and youth technical skills. Battery energy storage systems are critical for SDG 7 and 13.',
    retail:             'Prioritise local producer sourcing, community employment in underserved provinces, and sustainable product lines. Eastern Cape and rural market reach is a key SDG 1 and 11 metric.',
    logistics:          'Focus on emissions reduction, road/rail modal shift, and SME supply chain inclusion.',
  },
  mandateContext: {
    Growth:       'Growth mandate companies have turnovers between R50m–R200m. Coaching should focus on scaling employment, deepening transformation, and expanding SDG impact as the business grows.',
    Empowerment:  'Empowerment mandate companies have turnovers up to R50m with 51%+ Black ownership. Coaching should focus on B-BBEE progression, inclusive procurement, and community job creation.',
    Development:  'Development mandate companies are early-stage micro-enterprises. Coaching should be highly practical and focused on foundational sustainability habits.',
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin@investscore.co.za',
};

// ============================================================
// MARVEL COMPANIES — fictional seed data for PM portal demo
// ============================================================

const PERIOD_TIMING: Record<string, { submittedDaysAgo: number; scoredDaysAgo: number }> = {
  'Q2 2025': { submittedDaysAgo: 365, scoredDaysAgo: 358 },
  'Q3 2025': { submittedDaysAgo: 275, scoredDaysAgo: 268 },
  'Q4 2025': { submittedDaysAgo: 185, scoredDaysAgo: 178 },
  'Q1 2026': { submittedDaysAgo: 7,   scoredDaysAgo: 6   },
};

interface MarvelSubmission {
  submissionPeriod: string;
  data:             Record<string, number | null>;
}

interface MarvelEntry {
  company: {
    id:                       string;
    name:                     string;
    sector:                   string;
    industry:                 string;
    location:                 string;
    mandate:                  string;
    bbbeeLevel:               number | null;
    bbbeeVerificationStatus:  string | null;
    description:              string;
    website:                  string | null;
    spokespersonName:         string;
    spokespersonTitle:        string;
    spokespersonEmail:        string;
    targetIrr:                number;
    active:                   boolean;
  };
  smeUser: { email: string; password: string; name: string };
  submissions: MarvelSubmission[];
}

const MARVEL_COMPANIES: MarvelEntry[] = [

  // ── 1. STARK INDUSTRIES SA ─────────────────────────────────────────────────
  {
    company: {
      id: 'stark-industries-sa', name: 'Stark Industries SA',
      sector: 'manufacturing', industry: 'Advanced Manufacturing & Clean Tech',
      location: 'Johannesburg, Gauteng', mandate: 'Growth',
      bbbeeLevel: 2, bbbeeVerificationStatus: 'verified',
      description: 'Advanced manufacturing company producing precision components and clean energy equipment for the South African industrial sector.',
      website: 'https://stark-sa.co.za',
      spokespersonName: 'Tony Stark-Dlamini', spokespersonTitle: 'Chief Executive Officer',
      spokespersonEmail: 'tony@stark-sa.co.za', targetIrr: 22, active: true,
    },
    smeUser: { email: 'sme.stark@investscore.co.za', password: 'Stark@2026!', name: 'Tony Stark-Dlamini' },
    submissions: [
      {
        submissionPeriod: 'Q3 2025',
        data: {
          total_employees: 108, youth_employees: 54, female_employees: 38,
          management_employees: 28, contractor_employees: 6, staff_employees: 80,
          black_employees: 89, coloured_employees: 12, indian_employees: 4, white_employees: 3, male_employees: 70,
          scope1_co2e: 42, scope2_co2e: 38, electricity_consumption: 41000,
          renewable_energy_produced: 18000, renewable_energy_utilised: 18000,
          total_water_consumption: 280, recycled_waste_pct: 52,
          bbbee_rating: 2, black_ownership_pct: 55, black_female_ownership_pct: 22, black_board_pct: 72,
          procurement_black_owned_pct: 68, procurement_women_owned_pct: 31,
          total_annual_revenue: 145000000, csi_spend: 185000, local_suppliers: 24, smes_in_supply_chain: 18,
          units_produced: 4200, local_raw_material_pct: 74, apprentices_supported: 8,
        },
      },
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 118, youth_employees: 61, female_employees: 44,
          management_employees: 31, contractor_employees: 4, staff_employees: 87,
          black_employees: 98, coloured_employees: 13, indian_employees: 4, white_employees: 3, male_employees: 74,
          scope1_co2e: 38, scope2_co2e: 31, electricity_consumption: 38000,
          renewable_energy_produced: 24000, renewable_energy_utilised: 24000,
          total_water_consumption: 260, recycled_waste_pct: 61,
          bbbee_rating: 2, black_ownership_pct: 55, black_female_ownership_pct: 26, black_board_pct: 75,
          procurement_black_owned_pct: 72, procurement_women_owned_pct: 38,
          total_annual_revenue: 158000000, csi_spend: 210000, local_suppliers: 28, smes_in_supply_chain: 22,
          units_produced: 4800, local_raw_material_pct: 79, apprentices_supported: 10,
        },
      },
    ],
  },

  // ── 2. WAKANDA CAPITAL ─────────────────────────────────────────────────────
  {
    company: {
      id: 'wakanda-capital', name: 'Wakanda Capital',
      sector: 'financial_services', industry: 'Alternative Finance & SME Lending',
      location: 'Pretoria, Gauteng', mandate: 'Empowerment',
      bbbeeLevel: 1, bbbeeVerificationStatus: 'verified',
      description: '100% Black-owned alternative finance provider deploying revenue-based finance to Black-owned SMEs in township and peri-urban markets.',
      website: 'https://wakandacapital.co.za',
      spokespersonName: "T'Challa Mokoena", spokespersonTitle: 'Managing Director',
      spokespersonEmail: 'tchalla@wakandacapital.co.za', targetIrr: 17, active: true,
    },
    smeUser: { email: 'sme.wakanda@investscore.co.za', password: 'Wakanda@2026!', name: "T'Challa Mokoena" },
    submissions: [
      {
        submissionPeriod: 'Q3 2025',
        data: {
          total_employees: 22, youth_employees: 14, female_employees: 13,
          management_employees: 6, contractor_employees: 2, staff_employees: 16,
          black_employees: 22, coloured_employees: 0, indian_employees: 0, white_employees: 0, male_employees: 9,
          scope1_co2e: 4, scope2_co2e: 8, electricity_consumption: 8800,
          renewable_energy_produced: 0, renewable_energy_utilised: 0,
          total_water_consumption: 45, recycled_waste_pct: 22,
          bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 60, black_board_pct: 100,
          procurement_black_owned_pct: 88, procurement_women_owned_pct: 55,
          total_annual_revenue: 18000000, csi_spend: 45000, local_suppliers: 8, smes_in_supply_chain: 8,
          smes_funded: 18, black_smes_funded_pct: 100, women_led_smes_funded_pct: 44,
          capital_deployed_smes: 8200000, jobs_supported_smes: 124,
        },
      },
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 28, youth_employees: 18, female_employees: 17,
          management_employees: 7, contractor_employees: 1, staff_employees: 21,
          black_employees: 28, coloured_employees: 0, indian_employees: 0, white_employees: 0, male_employees: 11,
          scope1_co2e: 4, scope2_co2e: 9, electricity_consumption: 9200,
          renewable_energy_produced: 2400, renewable_energy_utilised: 2400,
          total_water_consumption: 52, recycled_waste_pct: 28,
          bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 60, black_board_pct: 100,
          procurement_black_owned_pct: 91, procurement_women_owned_pct: 61,
          total_annual_revenue: 24000000, csi_spend: 68000, local_suppliers: 11, smes_in_supply_chain: 11,
          smes_funded: 26, black_smes_funded_pct: 100, women_led_smes_funded_pct: 50,
          capital_deployed_smes: 12400000, jobs_supported_smes: 188,
        },
      },
    ],
  },

  // ── 3. ROMANOFF & ASSOCIATES ───────────────────────────────────────────────
  {
    company: {
      id: 'romanoff-associates', name: 'Romanoff & Associates',
      sector: 'ict', industry: 'Cybersecurity & IT Services',
      location: 'Cape Town, Western Cape', mandate: 'Empowerment',
      bbbeeLevel: 1, bbbeeVerificationStatus: 'verified',
      description: 'Black women-owned cybersecurity and managed IT services provider serving mid-market South African businesses.',
      website: 'https://romanoff.co.za',
      spokespersonName: 'Natasha Romanoff-Ndlovu', spokespersonTitle: 'CEO & Founder',
      spokespersonEmail: 'natasha@romanoff.co.za', targetIrr: 16, active: true,
    },
    smeUser: { email: 'sme.romanoff@investscore.co.za', password: 'Romanoff@2026!', name: 'Natasha Romanoff-Ndlovu' },
    submissions: [
      {
        submissionPeriod: 'Q3 2025',
        data: {
          total_employees: 31, youth_employees: 16, female_employees: 19,
          management_employees: 8, contractor_employees: 5, staff_employees: 23,
          black_employees: 28, coloured_employees: 2, indian_employees: 1, white_employees: 0, male_employees: 12,
          scope1_co2e: 6, scope2_co2e: 14, electricity_consumption: 15000,
          renewable_energy_produced: 0, renewable_energy_utilised: 0,
          total_water_consumption: 78, recycled_waste_pct: 18,
          bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 100, black_board_pct: 100,
          procurement_black_owned_pct: 74, procurement_women_owned_pct: 68,
          total_annual_revenue: 32000000, csi_spend: 28000, local_suppliers: 12, smes_in_supply_chain: 9,
          new_customers_connected: 420, average_cost_of_service: 890,
        },
      },
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 38, youth_employees: 21, female_employees: 24,
          management_employees: 9, contractor_employees: 3, staff_employees: 29,
          black_employees: 35, coloured_employees: 2, indian_employees: 1, white_employees: 0, male_employees: 14,
          scope1_co2e: 6, scope2_co2e: 15, electricity_consumption: 16500,
          renewable_energy_produced: 3600, renewable_energy_utilised: 3600,
          total_water_consumption: 82, recycled_waste_pct: 24,
          bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 100, black_board_pct: 100,
          procurement_black_owned_pct: 80, procurement_women_owned_pct: 72,
          total_annual_revenue: 41000000, csi_spend: 42000, local_suppliers: 15, smes_in_supply_chain: 12,
          new_customers_connected: 680, average_cost_of_service: 820,
        },
      },
    ],
  },

  // ── 4. BANNER GREEN TECH ───────────────────────────────────────────────────
  // One submission only — overdue, Low classification
  {
    company: {
      id: 'banner-green-tech', name: 'Banner Green Tech',
      sector: 'infrastructure', industry: 'Water Infrastructure & Sanitation',
      location: 'Durban, KwaZulu-Natal', mandate: 'Development',
      bbbeeLevel: null, bbbeeVerificationStatus: null,
      description: 'Early-stage water infrastructure and sanitation technology company developing low-cost water purification solutions for peri-urban communities.',
      website: null,
      spokespersonName: 'Bruce Banner-Khumalo', spokespersonTitle: 'Founder',
      spokespersonEmail: 'bruce@bannergreentech.co.za', targetIrr: 10, active: true,
    },
    smeUser: { email: 'sme.banner@investscore.co.za', password: 'Banner@2026!', name: 'Bruce Banner-Khumalo' },
    submissions: [
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 8, youth_employees: 5, female_employees: 3,
          management_employees: 2, contractor_employees: 4, staff_employees: 4,
          black_employees: 7, coloured_employees: 1, indian_employees: 0, white_employees: 0, male_employees: 5,
          scope1_co2e: null, scope2_co2e: null, electricity_consumption: null,
          renewable_energy_produced: null, renewable_energy_utilised: null,
          total_water_consumption: null, recycled_waste_pct: null,
          bbbee_rating: null, black_ownership_pct: 75, black_female_ownership_pct: null, black_board_pct: null,
          procurement_black_owned_pct: null, procurement_women_owned_pct: null,
          total_annual_revenue: 420000, csi_spend: null, local_suppliers: 3, smes_in_supply_chain: 3,
          water_connections: 180, water_loss_reduction_pct: null,
        },
      },
    ],
  },

  // ── 5. ROGERS HOUSING SOLUTIONS ────────────────────────────────────────────
  {
    company: {
      id: 'rogers-housing', name: 'Rogers Housing Solutions',
      sector: 'housing', industry: 'Affordable Housing Development',
      location: 'Johannesburg, Gauteng', mandate: 'Growth',
      bbbeeLevel: 3, bbbeeVerificationStatus: 'verified',
      description: 'Affordable housing developer focused on integrated residential communities in Johannesburg South and Soweto, with an in-house digital mortgage origination platform.',
      website: 'https://rogershousing.co.za',
      spokespersonName: 'Steve Rogers-Sithole', spokespersonTitle: 'Managing Director',
      spokespersonEmail: 'steve@rogershousing.co.za', targetIrr: 18, active: true,
    },
    smeUser: { email: 'sme.rogers@investscore.co.za', password: 'Rogers@2026!', name: 'Steve Rogers-Sithole' },
    submissions: [
      {
        submissionPeriod: 'Q2 2025',
        data: {
          total_employees: 42, youth_employees: 18, female_employees: 22,
          management_employees: 10, contractor_employees: 8, staff_employees: 34,
          black_employees: 36, coloured_employees: 4, indian_employees: 1, white_employees: 1, male_employees: 20,
          scope1_co2e: 18, scope2_co2e: 22, electricity_consumption: 24000,
          renewable_energy_produced: 0, renewable_energy_utilised: 0,
          total_water_consumption: 420, recycled_waste_pct: 12,
          bbbee_rating: 3, black_ownership_pct: 52, black_female_ownership_pct: 28, black_board_pct: 67,
          procurement_black_owned_pct: 58, procurement_women_owned_pct: 28,
          total_annual_revenue: 88000000, csi_spend: 92000, local_suppliers: 16, smes_in_supply_chain: 12,
          affordable_houses: 124, social_housing_units: 42,
        },
      },
      {
        submissionPeriod: 'Q4 2025',
        data: {
          total_employees: 48, youth_employees: 21, female_employees: 26,
          management_employees: 11, contractor_employees: 6, staff_employees: 42,
          black_employees: 42, coloured_employees: 4, indian_employees: 1, white_employees: 1, male_employees: 22,
          scope1_co2e: 16, scope2_co2e: 20, electricity_consumption: 22000,
          renewable_energy_produced: 4800, renewable_energy_utilised: 4800,
          total_water_consumption: 390, recycled_waste_pct: 19,
          bbbee_rating: 3, black_ownership_pct: 52, black_female_ownership_pct: 28, black_board_pct: 67,
          procurement_black_owned_pct: 62, procurement_women_owned_pct: 31,
          total_annual_revenue: 102000000, csi_spend: 118000, local_suppliers: 18, smes_in_supply_chain: 14,
          affordable_houses: 156, social_housing_units: 58,
        },
      },
    ],
  },

  // ── 6. MAXIMOFF ENERGY ─────────────────────────────────────────────────────
  // Declining — no Q1 2026 submission (overdue)
  {
    company: {
      id: 'maximoff-energy', name: 'Maximoff Energy',
      sector: 'manufacturing', industry: 'Solar PV Assembly & Distribution',
      location: 'Port Elizabeth, Eastern Cape', mandate: 'Empowerment',
      bbbeeLevel: 2, bbbeeVerificationStatus: 'verified',
      description: 'Solar PV panel assembly and distribution company supplying the residential and commercial solar market in the Eastern Cape and Western Cape.',
      website: 'https://maximoffenergy.co.za',
      spokespersonName: 'Wanda Maximoff-Dube', spokespersonTitle: 'Chief Operations Officer',
      spokespersonEmail: 'wanda@maximoffenergy.co.za', targetIrr: 15, active: true,
    },
    smeUser: { email: 'sme.maximoff@investscore.co.za', password: 'Maximoff@2026!', name: 'Wanda Maximoff-Dube' },
    submissions: [
      {
        submissionPeriod: 'Q2 2025',
        data: {
          total_employees: 58, youth_employees: 38, female_employees: 22,
          management_employees: 12, contractor_employees: 8, staff_employees: 50,
          black_employees: 52, coloured_employees: 4, indian_employees: 1, white_employees: 1, male_employees: 36,
          scope1_co2e: 28, scope2_co2e: 44, electricity_consumption: 48000,
          renewable_energy_produced: 12000, renewable_energy_utilised: 12000,
          total_water_consumption: 220, recycled_waste_pct: 44,
          bbbee_rating: 2, black_ownership_pct: 68, black_female_ownership_pct: 34, black_board_pct: 80,
          procurement_black_owned_pct: 72, procurement_women_owned_pct: 36,
          total_annual_revenue: 38000000, csi_spend: 42000, local_suppliers: 14, smes_in_supply_chain: 10,
          units_produced: 2800, local_raw_material_pct: 38, apprentices_supported: 6,
        },
      },
      {
        submissionPeriod: 'Q4 2025',
        data: {
          total_employees: 52, youth_employees: 30, female_employees: 18,
          management_employees: 10, contractor_employees: 14, staff_employees: 38,
          black_employees: 46, coloured_employees: 4, indian_employees: 1, white_employees: 1, male_employees: 34,
          scope1_co2e: null, scope2_co2e: null, electricity_consumption: null,
          renewable_energy_produced: null, renewable_energy_utilised: null,
          total_water_consumption: null, recycled_waste_pct: null,
          bbbee_rating: 2, black_ownership_pct: 68, black_female_ownership_pct: 34, black_board_pct: 80,
          procurement_black_owned_pct: 65, procurement_women_owned_pct: 28,
          total_annual_revenue: 34000000, csi_spend: 18000, local_suppliers: 11, smes_in_supply_chain: 8,
          units_produced: 2200, local_raw_material_pct: 32, apprentices_supported: 4,
        },
      },
    ],
  },

  // ── 7. DANVERS LOGISTICS ───────────────────────────────────────────────────
  {
    company: {
      id: 'danvers-logistics', name: 'Danvers Logistics',
      sector: 'logistics', industry: 'Cold Chain Logistics & Distribution',
      location: 'Cape Town, Western Cape', mandate: 'Growth',
      bbbeeLevel: 2, bbbeeVerificationStatus: 'verified',
      description: 'Women-led cold chain logistics company providing temperature-controlled distribution for food retail and pharmaceutical clients across the Western and Eastern Cape.',
      website: 'https://danverslogistics.co.za',
      spokespersonName: 'Carol Danvers-Nkosi', spokespersonTitle: 'CEO',
      spokespersonEmail: 'carol@danverslogistics.co.za', targetIrr: 20, active: true,
    },
    smeUser: { email: 'sme.danvers@investscore.co.za', password: 'Danvers@2026!', name: 'Carol Danvers-Nkosi' },
    submissions: [
      {
        submissionPeriod: 'Q2 2025',
        data: {
          total_employees: 74, youth_employees: 32, female_employees: 44,
          management_employees: 18, contractor_employees: 4, staff_employees: 70,
          black_employees: 64, coloured_employees: 8, indian_employees: 1, white_employees: 1, male_employees: 30,
          scope1_co2e: 88, scope2_co2e: 32, electricity_consumption: 34000,
          renewable_energy_produced: 8000, renewable_energy_utilised: 8000,
          total_water_consumption: 180, recycled_waste_pct: 58,
          bbbee_rating: 2, black_ownership_pct: 62, black_female_ownership_pct: 38, black_board_pct: 78,
          procurement_black_owned_pct: 74, procurement_women_owned_pct: 48,
          total_annual_revenue: 122000000, csi_spend: 148000, local_suppliers: 22, smes_in_supply_chain: 16,
        },
      },
      {
        submissionPeriod: 'Q4 2025',
        data: {
          total_employees: 82, youth_employees: 36, female_employees: 50,
          management_employees: 20, contractor_employees: 2, staff_employees: 80,
          black_employees: 72, coloured_employees: 8, indian_employees: 1, white_employees: 1, male_employees: 32,
          scope1_co2e: 82, scope2_co2e: 28, electricity_consumption: 31000,
          renewable_energy_produced: 12000, renewable_energy_utilised: 12000,
          total_water_consumption: 165, recycled_waste_pct: 64,
          bbbee_rating: 2, black_ownership_pct: 62, black_female_ownership_pct: 38, black_board_pct: 80,
          procurement_black_owned_pct: 78, procurement_women_owned_pct: 52,
          total_annual_revenue: 138000000, csi_spend: 182000, local_suppliers: 26, smes_in_supply_chain: 20,
        },
      },
    ],
  },

  // ── 8. PARKER RETAIL GROUP ─────────────────────────────────────────────────
  // One submission only — Low classification
  {
    company: {
      id: 'parker-retail', name: 'Parker Retail Group',
      sector: 'retail', industry: 'Informal & Community Retail',
      location: 'Soweto, Gauteng', mandate: 'Development',
      bbbeeLevel: null, bbbeeVerificationStatus: null,
      description: 'Community retail operator managing a network of upgraded spaza shops and a small supermarket in Soweto, focused on affordable food access.',
      website: null,
      spokespersonName: 'Peter Parker-Zulu', spokespersonTitle: 'Founder & Owner',
      spokespersonEmail: 'peter@parkerretail.co.za', targetIrr: 9, active: true,
    },
    smeUser: { email: 'sme.parker@investscore.co.za', password: 'Parker@2026!', name: 'Peter Parker-Zulu' },
    submissions: [
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 14, youth_employees: 10, female_employees: 8,
          management_employees: 3, contractor_employees: 2, staff_employees: 12,
          black_employees: 14, coloured_employees: 0, indian_employees: 0, white_employees: 0, male_employees: 6,
          scope1_co2e: null, scope2_co2e: null, electricity_consumption: null,
          renewable_energy_produced: null, renewable_energy_utilised: null,
          total_water_consumption: null, recycled_waste_pct: null,
          bbbee_rating: null, black_ownership_pct: 100, black_female_ownership_pct: null, black_board_pct: null,
          procurement_black_owned_pct: null, procurement_women_owned_pct: null,
          total_annual_revenue: 680000, csi_spend: null, local_suppliers: 6, smes_in_supply_chain: 6,
          products_local_producers_pct: 42, low_income_customers: 2400, sustainable_products_pct: null,
        },
      },
    ],
  },

  // ── 9. ODINSON AGRI ────────────────────────────────────────────────────────
  {
    company: {
      id: 'odinson-agri', name: 'Odinson Agri',
      sector: 'manufacturing', industry: 'Agricultural Processing & Export',
      location: 'Tzaneen, Limpopo', mandate: 'Empowerment',
      bbbeeLevel: 2, bbbeeVerificationStatus: 'verified',
      description: 'Black-owned macadamia and subtropical fruit processing plant supplying premium export markets and local food manufacturers.',
      website: 'https://odinsonagri.co.za',
      spokespersonName: 'Thor Odinson-Mahlangu', spokespersonTitle: 'Managing Director',
      spokespersonEmail: 'thor@odinsonagri.co.za', targetIrr: 16, active: true,
    },
    smeUser: { email: 'sme.odinson@investscore.co.za', password: 'Odinson@2026!', name: 'Thor Odinson-Mahlangu' },
    submissions: [
      {
        submissionPeriod: 'Q3 2025',
        data: {
          total_employees: 91, youth_employees: 38, female_employees: 54,
          management_employees: 16, contractor_employees: 12, staff_employees: 79,
          black_employees: 88, coloured_employees: 2, indian_employees: 0, white_employees: 1, male_employees: 37,
          scope1_co2e: 62, scope2_co2e: 74, electricity_consumption: 80000,
          renewable_energy_produced: 0, renewable_energy_utilised: 0,
          total_water_consumption: 8400, recycled_waste_pct: 28,
          bbbee_rating: 2, black_ownership_pct: 74, black_female_ownership_pct: 22, black_board_pct: 83,
          procurement_black_owned_pct: 61, procurement_women_owned_pct: 38,
          total_annual_revenue: 44000000, csi_spend: 58000, local_suppliers: 18, smes_in_supply_chain: 14,
          units_produced: 3200, local_raw_material_pct: 92, apprentices_supported: 5,
        },
      },
      {
        submissionPeriod: 'Q1 2026',
        data: {
          total_employees: 104, youth_employees: 44, female_employees: 62,
          management_employees: 18, contractor_employees: 8, staff_employees: 96,
          black_employees: 101, coloured_employees: 2, indian_employees: 0, white_employees: 1, male_employees: 42,
          scope1_co2e: 58, scope2_co2e: 68, electricity_consumption: 74000,
          renewable_energy_produced: 14000, renewable_energy_utilised: 14000,
          total_water_consumption: 7800, recycled_waste_pct: 36,
          bbbee_rating: 2, black_ownership_pct: 74, black_female_ownership_pct: 26, black_board_pct: 83,
          procurement_black_owned_pct: 68, procurement_women_owned_pct: 44,
          total_annual_revenue: 52000000, csi_spend: 72000, local_suppliers: 22, smes_in_supply_chain: 18,
          units_produced: 3800, local_raw_material_pct: 94, apprentices_supported: 7,
        },
      },
    ],
  },
];

async function seedMarvelCompanies() {
  console.log('\nSeeding Marvel companies...');

  for (const entry of MARVEL_COMPANIES) {
    console.log(`  ${entry.company.name}:`);

    // 1. Company document
    await db.collection('companies').doc(entry.company.id).set({
      ...entry.company,
      createdAt: new Date().toISOString(),
    });

    // 2. Firebase Auth user + custom claims
    let uid: string | null = null;
    try {
      try {
        const existing = await adminAuth.getUserByEmail(entry.smeUser.email);
        await db.collection('users').doc(existing.uid).delete();
        await adminAuth.deleteUser(existing.uid);
      } catch {}

      const user = await adminAuth.createUser({
        email:         entry.smeUser.email,
        password:      entry.smeUser.password,
        displayName:   entry.smeUser.name,
        emailVerified: true,
      });
      uid = user.uid;
      await adminAuth.setCustomUserClaims(uid, {
        role:      'sme',
        companyId: entry.company.id,
      });
    } catch (err) {
      console.error(`    Auth error for ${entry.smeUser.email}:`, err);
    }

    // 3. Users document
    if (uid) {
      await db.collection('users').doc(uid).set({
        uid,
        email:     entry.smeUser.email,
        name:      entry.smeUser.name,
        role:      'sme',
        companyId: entry.company.id,
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Submissions + scorecards
    for (const sub of entry.submissions) {
      const timing = PERIOD_TIMING[sub.submissionPeriod]
        ?? { submittedDaysAgo: 90, scoredDaysAgo: 83 };

      const kpiInputs = Object.entries(sub.data).map(([kpiId, value]) => ({
        kpiId,
        value: value as number | null,
      }));

      const { overallScore, classification, kpiResults } =
        calculateScore(entry.company.sector as any, kpiInputs);
      const sdgScores = calculateSDGScores(kpiResults, entry.company.sector);

      const suffix       = sub.submissionPeriod.replace(/\s+/g, '_').toLowerCase();
      const submissionId = `sub_${entry.company.id}_${suffix}`;
      const scorecardId  = `scorecard_${entry.company.id}_${suffix}`;

      await db.collection('submissions').doc(submissionId).set({
        id:               submissionId,
        companyId:        entry.company.id,
        period:           sub.submissionPeriod,
        status:           'scored',
        data:             sub.data,
        submittedAt:      daysAgoISO(timing.submittedDaysAgo),
        scoredAt:         daysAgoISO(timing.scoredDaysAgo),
      });

      await db.collection('scorecards').doc(scorecardId).set({
        id:               scorecardId,
        companyId:        entry.company.id,
        submissionId,
        overallScore,
        classification,
        sdgScores,
        calculatedAt:     daysAgoISO(timing.scoredDaysAgo),
        submissionPeriod: sub.submissionPeriod,
      });

      console.log(`    ${sub.submissionPeriod}: ${overallScore.toFixed(2)} (${classification})`);
    }

    console.log(`    ✓ ${entry.company.name}`);
  }

  console.log(`  Seeded ${MARVEL_COMPANIES.length} Marvel companies`);
}

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function createUser(userData: typeof DEMO_USERS[number]) {
  try {
    try {
      const existing = await adminAuth.getUserByEmail(userData.email);
      // Delete the old Firestore doc before deleting the Auth user (old UID)
      await db.collection('users').doc(existing.uid).delete();
      await adminAuth.deleteUser(existing.uid);
      console.log(`  Deleted existing user: ${userData.email}`);
    } catch {}

    const user = await adminAuth.createUser({
      email:         userData.email,
      password:      userData.password,
      displayName:   userData.name,
      emailVerified: true,
    });

    await adminAuth.setCustomUserClaims(user.uid, {
      role:      userData.role,
      ...('companyId' in userData && userData.companyId ? { companyId: userData.companyId } : {}),
    });

    await db.collection('users').doc(user.uid).set({
      uid:       user.uid,
      email:     userData.email,
      name:      userData.name,
      role:      userData.role,
      companyId: ('companyId' in userData) ? userData.companyId : null,
      createdAt: new Date().toISOString(),
    });

    console.log(`  Created user: ${userData.email} (${userData.role}) uid: ${user.uid}`);
    return user.uid;
  } catch (err) {
    console.error(`  Failed to create user ${userData.email}:`, err);
    return null;
  }
}

async function seedCompany(company: typeof DEMO_COMPANIES[number]) {
  const { kpiData, ...companyMeta } = company;

  await db.collection('companies').doc(company.id).set({
    ...companyMeta,
    createdAt: new Date().toISOString(),
  });

  const kpiInputs = Object.entries(kpiData).map(([kpiId, value]) => ({
    kpiId,
    value: value as number,
  }));

  const { overallScore, classification, kpiResults } = calculateScore(
    company.sector as any,
    kpiInputs
  );

  const sdgScores    = calculateSDGScores(kpiResults, company.sector);
  const submissionId = `sub_${company.id}_q1_2026`;
  const period       = 'Q1 2026';

  await db.collection('submissions').doc(submissionId).set({
    id:          submissionId,
    companyId:   company.id,
    period,
    status:      'scored',
    data:        kpiData,
    submittedAt: daysAgoISO(7),
    scoredAt:    daysAgoISO(6),
  });

  const scorecardId = `scorecard_${company.id}_q1_2026`;
  await db.collection('scorecards').doc(scorecardId).set({
    id:               scorecardId,
    companyId:        company.id,
    submissionId,
    overallScore,
    classification,
    sdgScores,
    calculatedAt:     daysAgoISO(6),
    submissionPeriod: period,
  });

  console.log(`  Seeded: ${company.name} | Score: ${overallScore.toFixed(2)} (${classification})`);
}

async function seedHistoricalData(
  companyId:   string,
  sector:      string,
  historicalKpis: Record<string, number>[],
) {
  for (let i = 0; i < HISTORICAL_PERIODS.length; i++) {
    const { period, submittedDaysAgo, scoredDaysAgo } = HISTORICAL_PERIODS[i];
    const kpiData = historicalKpis[i];
    const suffix  = period.replace(' ', '_').toLowerCase();

    const kpiInputs = Object.entries(kpiData).map(([kpiId, value]) => ({
      kpiId,
      value: value as number,
    }));

    const { overallScore, classification, kpiResults } = calculateScore(sector as any, kpiInputs);
    const sdgScores = calculateSDGScores(kpiResults, sector);

    const submissionId = `sub_${companyId}_${suffix}`;
    const scorecardId  = `scorecard_${companyId}_${suffix}`;

    await db.collection('submissions').doc(submissionId).set({
      id:          submissionId,
      companyId,
      period,
      status:      'scored',
      data:        kpiData,
      submittedAt: daysAgoISO(submittedDaysAgo),
      scoredAt:    daysAgoISO(scoredDaysAgo),
    });

    await db.collection('scorecards').doc(scorecardId).set({
      id:               scorecardId,
      companyId,
      submissionId,
      overallScore,
      classification,
      sdgScores,
      calculatedAt:     daysAgoISO(scoredDaysAgo),
      submissionPeriod: period,
    });

    console.log(`    ${period}: score ${overallScore.toFixed(2)} (${classification})`);
  }
}

async function seedNotifications() {
  const batch = db.batch();
  for (const notif of DEMO_NOTIFICATIONS) {
    const ref = db.collection('notifications').doc(notif.id);
    batch.set(ref, notif);
  }
  await batch.commit();
  console.log(`  Seeded ${DEMO_NOTIFICATIONS.length} notifications`);
}

async function seedTargets() {
  for (const t of DEMO_TARGETS) {
    await db.collection('targets').doc(t.companyId).set({
      companyId:  t.companyId,
      targets:    t.targets,
      updatedAt:  new Date().toISOString(),
      updatedBy:  'pm@investscore.co.za',
    });
  }
  console.log(`  Seeded targets for ${DEMO_TARGETS.length} companies`);
}

async function seedEngagement() {
  for (const entry of DEMO_ENGAGEMENT) {
    await db.collection('engagementLogs').add(entry);
  }
  console.log(`  Seeded ${DEMO_ENGAGEMENT.length} engagement log entries`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n🌱 InvestScore — Seeding Firebase...\n');

  console.log('Creating users...');
  for (const user of DEMO_USERS) {
    await createUser(user);
  }

  console.log('\nSeeding companies and Q1 2026 scorecards...');
  for (const company of DEMO_COMPANIES) {
    await seedCompany(company);
  }

  console.log('\nSeeding historical scorecards (Q1–Q4 2025)...');
  console.log('  Khaya Capital:');
  await seedHistoricalData('company_001', 'financial_services', KHAYA_HISTORICAL_KPIS);
  console.log('  Nkosi Manufacturing:');
  await seedHistoricalData('company_002', 'manufacturing', NKOSI_HISTORICAL_KPIS);
  console.log('  Tshiamo Tech:');
  await seedHistoricalData('company_003', 'ict', TSHIAMO_HISTORICAL_KPIS);

  console.log('\nSeeding notifications...');
  await seedNotifications();

  console.log('\nSeeding PM targets...');
  await seedTargets();

  console.log('\nSeeding engagement logs...');
  await seedEngagement();

  console.log('\nSeeding AI context...');
  await db.collection('aiContext').doc('global').set(AI_CONTEXT);

  await seedMarvelCompanies();

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin: admin@investscore.co.za       / Admin@2026!');
  console.log('  PM:    pm@investscore.co.za          / PM@2026!');
  console.log('  SME 1: sme1@investscore.co.za        / SME@2026!        → Khaya Capital');
  console.log('  SME 2: sme2@investscore.co.za        / SME2@2026!       → Nkosi Manufacturing');
  console.log('  SME 3: sme3@investscore.co.za        / SME3@2026!       → Tshiamo Tech');
  console.log('  --- Marvel series ---');
  console.log('  sme.stark@investscore.co.za          / Stark@2026!      → Stark Industries SA');
  console.log('  sme.wakanda@investscore.co.za        / Wakanda@2026!    → Wakanda Capital');
  console.log('  sme.romanoff@investscore.co.za       / Romanoff@2026!   → Romanoff & Associates');
  console.log('  sme.banner@investscore.co.za         / Banner@2026!     → Banner Green Tech');
  console.log('  sme.rogers@investscore.co.za         / Rogers@2026!     → Rogers Housing Solutions');
  console.log('  sme.maximoff@investscore.co.za       / Maximoff@2026!   → Maximoff Energy');
  console.log('  sme.danvers@investscore.co.za        / Danvers@2026!    → Danvers Logistics');
  console.log('  sme.parker@investscore.co.za         / Parker@2026!     → Parker Retail Group');
  console.log('  sme.odinson@investscore.co.za        / Odinson@2026!    → Odinson Agri');
  console.log('\nData seeded per SME company:');
  console.log('  • Q1 2026 submission + scorecard (current)');
  console.log('  • Q4, Q3, Q2, Q1 2025 submissions + scorecards (history/trends)');
  console.log('\nPortfolio-wide data seeded:');
  console.log(`  • ${DEMO_NOTIFICATIONS.length} notifications (PM alerts, submissions, classification changes)`);
  console.log(`  • SDG targets for ${DEMO_TARGETS.length} companies`);
  console.log(`  • ${DEMO_ENGAGEMENT.length} PM engagement log entries`);
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
