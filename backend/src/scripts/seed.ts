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
  {
    id: 'company_001',
    name: 'Khaya Capital',
    sector: 'financial_services',
    industry: 'SME Finance',
    location: 'Johannesburg, Gauteng',
    description: 'A Black-owned SME funding business providing growth capital to township enterprises.',
    website: 'https://khayacapital.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 3,
    spokespersonName: 'Sipho Nkosi',
    spokespersonEmail: 'sme1@investscore.co.za',
    spokespersonTitle: 'CEO',
    status: 'active',
    kpiData: {
      total_employees: 18, youth_employees: 8, female_employees: 9,
      management_employees: 4, staff_employees: 14,
      black_employees: 16, white_employees: 2,
      bbbee_rating: 1, black_ownership_pct: 75, black_female_ownership_pct: 35,
      black_board_pct: 80, black_board_number: 4,
      procurement_black_owned_pct: 65, procurement_women_owned_pct: 30,
      total_annual_revenue: 8500000,
      smes_funded: 12, black_smes_funded_pct: 75, women_led_smes_funded_pct: 40,
      capital_deployed_smes: 3200000, jobs_supported_smes: 87,
      csi_spend: 85000, local_suppliers: 9, smes_in_supply_chain: 7,
      scope1_co2e: 45, scope2_co2e: 120, recycled_waste_pct: 35,
    },
  },
  {
    id: 'company_002',
    name: 'Nkosi Manufacturing',
    sector: 'manufacturing',
    industry: 'Light Manufacturing',
    location: 'Durban, KwaZulu-Natal',
    description: 'A women-led manufacturing company producing eco-friendly packaging materials.',
    website: 'https://nkosimfg.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Amahle Zulu',
    spokespersonEmail: 'sme2@investscore.co.za',
    spokespersonTitle: 'Managing Director',
    status: 'active',
    kpiData: {
      total_employees: 34, youth_employees: 12, female_employees: 22,
      management_employees: 6, staff_employees: 28,
      black_employees: 30, white_employees: 4,
      bbbee_rating: 2, black_ownership_pct: 60, black_female_ownership_pct: 55,
      black_board_pct: 67, black_board_number: 2,
      procurement_black_owned_pct: 58, procurement_women_owned_pct: 45,
      total_annual_revenue: 12000000,
      units_produced: 850000, manufacturing_revenue_pct: 95,
      local_raw_material_pct: 72, apprentices_supported: 8,
      scope1_co2e: 180, scope2_co2e: 320, recycled_waste_pct: 68,
      total_water_consumption: 1200, electricity_consumption: 28000,
      renewable_energy_utilised: 6000, renewable_energy_produced: 6500,
      csi_spend: 120000, local_suppliers: 14, smes_in_supply_chain: 11,
    },
  },
  {
    id: 'company_003',
    name: 'Tshiamo Tech',
    sector: 'ict',
    industry: 'Software & Digital Services',
    location: 'Cape Town, Western Cape',
    description: 'A youth-owned ICT company building digital tools for underserved communities.',
    website: 'https://tshiamotech.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Thabo Mokoena',
    spokespersonEmail: 'sme3@investscore.co.za',
    spokespersonTitle: 'Founder & CTO',
    status: 'active',
    kpiData: {
      total_employees: 12, youth_employees: 10, female_employees: 5,
      management_employees: 3, staff_employees: 9,
      black_employees: 11, white_employees: 1,
      bbbee_rating: 1, black_ownership_pct: 90, black_female_ownership_pct: 20,
      black_board_pct: 100, black_board_number: 2,
      procurement_black_owned_pct: 70, procurement_women_owned_pct: 25,
      total_annual_revenue: 4200000,
      spectrum_units: 0, new_customers_connected: 3200,
      geographic_coverage_km2: 450, average_cost_of_service: 199,
      scope1_co2e: 15, scope2_co2e: 40, recycled_waste_pct: 20,
      electricity_consumption: 8000, renewable_energy_utilised: 1500,
      csi_spend: 35000, local_suppliers: 6, smes_in_supply_chain: 5,
    },
  },
  {
    id: 'company_004',
    name: 'Ubuntu Logistics',
    sector: 'logistics',
    industry: 'Freight & Distribution',
    location: 'Pretoria, Gauteng',
    description: 'A Black-owned logistics company specialising in last-mile delivery for SMEs.',
    website: 'https://ubuntulogistics.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Mandla Sithole',
    spokespersonEmail: 'mandla@ubuntulogistics.co.za',
    spokespersonTitle: 'CEO',
    status: 'active',
    kpiData: {
      total_employees: 45, youth_employees: 18, female_employees: 12,
      black_employees: 42, white_employees: 3,
      bbbee_rating: 2, black_ownership_pct: 85, black_female_ownership_pct: 15,
      black_board_pct: 75, black_board_number: 3,
      procurement_black_owned_pct: 70, procurement_women_owned_pct: 20,
      total_annual_revenue: 18000000,
      port_pairs_routes: 8, road_rail_share_pct: 85,
      tonnage_passengers_transported: 4200,
      scope1_co2e: 680, scope2_co2e: 95, recycled_waste_pct: 22,
      csi_spend: 60000, local_suppliers: 12, smes_in_supply_chain: 8,
    },
  },
  {
    id: 'company_005',
    name: 'Lungelo Housing',
    sector: 'housing',
    industry: 'Affordable Housing',
    location: 'East London, Eastern Cape',
    description: 'A social housing developer focused on delivering dignity housing in rural areas.',
    website: 'https://lungelohousing.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 3,
    spokespersonName: 'Nokwanda Dube',
    spokespersonEmail: 'nokwanda@lungelohousing.co.za',
    spokespersonTitle: 'Director',
    status: 'active',
    kpiData: {
      total_employees: 28, youth_employees: 10, female_employees: 16,
      black_employees: 27, white_employees: 1,
      bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 60,
      black_board_pct: 100, black_board_number: 3,
      procurement_black_owned_pct: 80, procurement_women_owned_pct: 55,
      total_annual_revenue: 9500000,
      affordable_houses: 42, social_housing_rental_avg: 2200,
      social_housing_units: 38,
      scope1_co2e: 95, scope2_co2e: 180, recycled_waste_pct: 45,
      total_water_consumption: 800, electricity_consumption: 15000,
      csi_spend: 95000, local_suppliers: 18, smes_in_supply_chain: 14,
    },
  },
  {
    id: 'company_006',
    name: 'Siyanda Retail Group',
    sector: 'retail',
    industry: 'Grocery Retail',
    location: 'Polokwane, Limpopo',
    description: 'A rural grocery chain sourcing from local farmers and cooperatives.',
    website: 'https://siyanda.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Refilwe Moagi',
    spokespersonEmail: 'refilwe@siyanda.co.za',
    spokespersonTitle: 'MD',
    status: 'active',
    kpiData: {
      total_employees: 52, youth_employees: 25, female_employees: 32,
      black_employees: 50, white_employees: 2,
      bbbee_rating: 2, black_ownership_pct: 70, black_female_ownership_pct: 40,
      black_board_pct: 80, black_board_number: 4,
      procurement_black_owned_pct: 60, procurement_women_owned_pct: 48,
      total_annual_revenue: 22000000,
      products_local_producers_pct: 55, low_income_customers: 8500,
      sustainable_products_pct: 28,
      scope1_co2e: 210, scope2_co2e: 380, recycled_waste_pct: 38,
      csi_spend: 180000, local_suppliers: 22, smes_in_supply_chain: 18,
    },
  },
  {
    id: 'company_007',
    name: 'Amanzi Water Solutions',
    sector: 'infrastructure',
    industry: 'Water Infrastructure',
    location: 'Bloemfontein, Free State',
    description: 'An infrastructure SME improving water access in underserved municipalities.',
    website: 'https://amanziwater.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 3,
    spokespersonName: 'Tshepo Letsie',
    spokespersonEmail: 'tshepo@amanziwater.co.za',
    spokespersonTitle: 'CEO',
    status: 'active',
    kpiData: {
      total_employees: 22, youth_employees: 9, female_employees: 8,
      black_employees: 20, white_employees: 2,
      bbbee_rating: 2, black_ownership_pct: 80, black_female_ownership_pct: 30,
      black_board_pct: 75, black_board_number: 3,
      procurement_black_owned_pct: 65, procurement_women_owned_pct: 28,
      total_annual_revenue: 7800000,
      scope1_co2e: 75, scope2_co2e: 145, recycled_waste_pct: 42,
      total_water_consumption: 950, electricity_consumption: 18000,
      renewable_energy_utilised: 3000,
      csi_spend: 75000, local_suppliers: 11, smes_in_supply_chain: 9,
      apprentices_supported: 5,
    },
  },
  {
    id: 'company_008',
    name: 'Ziyanda Agri Co',
    sector: 'manufacturing',
    industry: 'Agri-processing',
    location: 'George, Western Cape',
    description: 'A women-led agri-processing company turning local produce into export-ready goods.',
    website: 'https://ziyandaagri.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Ziyanda Ntuli',
    spokespersonEmail: 'ziyanda@ziyandaagri.co.za',
    spokespersonTitle: 'Founder',
    status: 'active',
    kpiData: {
      total_employees: 26, youth_employees: 14, female_employees: 18,
      black_employees: 24, white_employees: 2,
      bbbee_rating: 1, black_ownership_pct: 88, black_female_ownership_pct: 70,
      black_board_pct: 100, black_board_number: 2,
      procurement_black_owned_pct: 72, procurement_women_owned_pct: 60,
      total_annual_revenue: 6500000,
      units_produced: 320000, manufacturing_revenue_pct: 88,
      local_raw_material_pct: 90, apprentices_supported: 6,
      scope1_co2e: 95, scope2_co2e: 175, recycled_waste_pct: 72,
      total_water_consumption: 1800, electricity_consumption: 22000,
      renewable_energy_utilised: 8000, renewable_energy_produced: 8500,
      csi_spend: 65000, local_suppliers: 16, smes_in_supply_chain: 12,
    },
  },
  {
    id: 'company_009',
    name: 'Ithemba Digital',
    sector: 'ict',
    industry: 'EdTech',
    location: 'Soweto, Gauteng',
    description: 'A youth-led EdTech startup building offline-first learning apps for township schools.',
    website: 'https://ithembadigital.co.za',
    reportingCurrency: 'ZAR',
    fyeMonth: 2,
    spokespersonName: 'Lungelo Dlamini',
    spokespersonEmail: 'lungelo@ithembadigital.co.za',
    spokespersonTitle: 'CEO',
    status: 'active',
    kpiData: {
      total_employees: 8, youth_employees: 7, female_employees: 4,
      black_employees: 8, white_employees: 0,
      bbbee_rating: 1, black_ownership_pct: 100, black_female_ownership_pct: 40,
      black_board_pct: 100, black_board_number: 2,
      procurement_black_owned_pct: 80, procurement_women_owned_pct: 40,
      total_annual_revenue: 1800000,
      new_customers_connected: 8500, geographic_coverage_km2: 85,
      average_cost_of_service: 49,
      scope1_co2e: 8, scope2_co2e: 22, recycled_waste_pct: 15,
      electricity_consumption: 3500, renewable_energy_utilised: 800,
      csi_spend: 20000, local_suppliers: 4, smes_in_supply_chain: 3,
    },
  },
];

const AI_CONTEXT = {
  id: 'global',
  rules: [
    'Always refer to SDG scores as being calculated by the Sanlam proprietary methodology.',
    'Never suggest that an SME change their sector classification.',
    'When coaching on B-BBEE improvement, always refer to verified B-BBEE certificates.',
    'Tone should be encouraging and practical — never condescending.',
    'Always prioritise high-impact, low-cost improvements first.',
    'Reference South African context — use Rands, reference Eskom, B-BBEE, POPIA.',
    'Do not compare specific named companies against each other when coaching.',
  ],
  sectorNotes: {
    financial_services: 'Focus coaching on SME funding reach, Black ownership, and capital deployment impact.',
    manufacturing:      'Prioritise local sourcing, apprenticeships, and renewable energy adoption.',
    ict:                'Focus on customer reach, affordability, and geographic coverage.',
    housing:            'Prioritise affordability metrics and Black female ownership.',
    infrastructure:     'Focus on environmental metrics and local supplier development.',
    retail:             'Prioritise local sourcing and low-income customer reach.',
    logistics:          'Focus on emissions reduction and road/rail modal shift.',
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

  const sdgScores    = calculateSDGScores(kpiResults);
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

  console.log(`  Seeded: ${company.name} | Score: ${overallScore} (${classification})`);
}

async function main() {
  console.log('\n🌱 INvestScore — Seeding Firebase...\n');

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
