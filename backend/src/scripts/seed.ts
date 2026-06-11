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
// SEED DATA
// ============================================================

const DEMO_USERS = [
  { email: 'admin@investscore.co.za', password: 'Admin@2026!', role: 'admin', name: 'Sanlam Admin' },
  { email: 'pm@investscore.co.za',    password: 'PM@2026!',    role: 'pm',    name: 'Lerato Dlamini' },
  { email: 'sme1@investscore.co.za',  password: 'SME@2026!',   role: 'sme',   name: 'Sipho Nkosi',   companyId: 'company_001' },
  { email: 'sme2@investscore.co.za',  password: 'SME2@2026!',  role: 'sme',   name: 'Amahle Zulu',   companyId: 'company_002' },
  { email: 'sme3@investscore.co.za',  password: 'SME3@2026!',  role: 'sme',   name: 'Thabo Mokoena', companyId: 'company_003' },
] as const;

const DEMO_COMPANIES = [

  // ─── COMPANY 1 - Khaya Capital ───────────────────────────────────────────
  // Based on: Financial services / revenue-based finance / female co-founded
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
      total_employees:          18,
      youth_employees:           8,
      female_employees:         11,
      management_employees:      5,
      staff_employees:          13,
      contractor_employees:      0,
      black_employees:          14,
      white_employees:           4,
      coloured_employees:        0,
      indian_employees:          0,
      male_employees:            7,
      scope1_co2e:              18,
      scope2_co2e:              45,
      electricity_consumption: 9500,
      recycled_waste_pct:       28,
      renewable_energy_utilised: 800,
      renewable_energy_produced:  0,
      total_water_consumption:  180,
      bbbee_rating:              4,
      black_ownership_pct:      25,
      black_female_ownership_pct: 10,
      black_board_pct:          40,
      black_board_number:        2,
      procurement_black_owned_pct: 60,
      procurement_women_owned_pct: 45,
      total_annual_revenue:  9500000,
      csi_spend:             45000,
      local_suppliers:           8,
      smes_in_supply_chain:      6,
      smes_funded:              14,
      black_smes_funded_pct:    72,
      women_led_smes_funded_pct: 48,
      capital_deployed_smes: 3800000,
      jobs_supported_smes:      92,
    },
  },

  // ─── COMPANY 2 - Nkosi Manufacturing ──────────────────────────────────────
  // Based on: Black woman-owned transformer/electrical equipment manufacturer
  // 71 employees, 94% black, 21% female, Level 1 B-BBEE per report
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
  // Based on: Solar energy / clean tech company
  // 72 employees, 88% black, 44% female, 70%+ youth, Level 2 per report
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
  // Based on: Digital mortgage platform / affordable housing fintech
  // 25 employees, 96% black, 68% female, Level 2, 63% black ownership per report
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
  // Based on: Food manufacturing / Eastern Cape / solar PV / 100+ employees
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
  // Based on: BESS / clean energy storage / youth black-owned infrastructure
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
  // Based on: EdTech / digital inclusion / youth-led ICT
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
// SEED FUNCTIONS
// ============================================================

async function createUser(userData: typeof DEMO_USERS[number]) {
  try {
    try {
      const existing = await adminAuth.getUserByEmail(userData.email);
      await adminAuth.deleteUser(existing.uid);
      console.log(`  Deleted existing user: ${userData.email}`);
    } catch {}

    const user = await adminAuth.createUser({
      email:         userData.email,
      password:      userData.password,
      displayName:   userData.name,
      emailVerified: true,
    });

    await adminAuth.setCustomUserClaims(user.uid, { role: userData.role });

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
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    scoredAt:    new Date().toISOString(),
  });

  const scorecardId = `scorecard_${company.id}_q1_2026`;
  await db.collection('scorecards').doc(scorecardId).set({
    id:               scorecardId,
    companyId:        company.id,
    submissionId,
    overallScore,
    classification,
    sdgScores,
    calculatedAt:     new Date().toISOString(),
    submissionPeriod: period,
  });

  console.log(`  Seeded: ${company.name} | Sector: ${company.sector} | Score: ${overallScore.toFixed(2)} (${classification})`);
}

async function main() {
  console.log('\n🌱 InvestScore - Seeding Firebase...\n');

  console.log('Creating users...');
  for (const user of DEMO_USERS) {
    await createUser(user);
  }

  console.log('\nSeeding companies and scores...');
  for (const company of DEMO_COMPANIES) {
    await seedCompany(company);
  }

  console.log('\nSeeding AI context...');
  await db.collection('aiContext').doc('global').set(AI_CONTEXT);

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin: admin@investscore.co.za / Admin@2026!');
  console.log('  PM:    pm@investscore.co.za    / PM@2026!');
  console.log('  SME1:  sme1@investscore.co.za  / SME@2026!   (Khaya Capital)');
  console.log('  SME2:  sme2@investscore.co.za  / SME2@2026!  (Nkosi Manufacturing)');
  console.log('  SME3:  sme3@investscore.co.za  / SME3@2026!  (Tshiamo Tech)');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
