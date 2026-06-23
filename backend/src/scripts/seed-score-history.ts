import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

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

const db = admin.firestore();

// Historical periods — all before the current seed date
const PERIODS = [
  { period: 'Q2-2025', calculatedAt: '2025-06-30T00:00:00.000Z' },
  { period: 'Q3-2025', calculatedAt: '2025-09-30T00:00:00.000Z' },
  { period: 'Q4-2025', calculatedAt: '2025-12-31T00:00:00.000Z' },
];

// Score offsets per period relative to current (most recent) score.
// improving: scores were lower in the past → positive trend into Q1 2026
// declining: scores were higher in the past → negative trend
// stable:    tiny noise, no real movement
const TRAJECTORIES = {
  improving: [-0.35, -0.22, -0.12],   // Q2, Q3, Q4 offsets from current
  declining: [+0.30, +0.20, +0.12],
  stable:    [+0.04, -0.02, +0.03],
} as const;

function clamp(v: number, lo = 1.0, hi = 3.0) {
  return Math.round(Math.max(lo, Math.min(hi, v)) * 100) / 100;
}

function classify(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 2.5) return 'High';
  if (score >= 1.75) return 'Medium';
  return 'Low';
}

// Minimal SDG scores — proportional to overall score.
// These historical docs are for sparklines/trend only; company detail
// already has a full current scorecard from the main seed.
function buildSdgScores(overallScore: number) {
  const pairs = [
    { sdgId: 8,  sdgName: 'Decent Work and Economic Growth' },
    { sdgId: 10, sdgName: 'Reduced Inequalities' },
    { sdgId: 13, sdgName: 'Climate Action' },
    { sdgId: 17, sdgName: 'Partnerships for the Goals' },
  ];
  return pairs.map(({ sdgId, sdgName }) => {
    const noise = (sdgId % 3 === 0 ? 0.1 : sdgId % 3 === 1 ? -0.05 : 0.07);
    const score = clamp(overallScore + noise);
    return {
      sdgId,
      sdgName,
      score,
      classification: classify(score),
      sectorAvg: 2.0,
      trend: score > 2.0 ? 'up' : score < 1.8 ? 'down' : 'stable',
    };
  });
}

async function main() {
  console.log('\nSeeding historical scorecard periods...\n');

  // 1. Load all companies
  const companiesSnap = await db.collection('companies').get();
  const companies = companiesSnap.docs
    .filter(d => d.data().active !== false)
    .map(d => ({ id: d.id, name: d.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Found ${companies.length} active companies.\n`);

  // 2. Assign trajectories deterministically by sorted position
  //    ~44% improving, ~22% declining, ~33% stable  →  nice spread for 18 companies
  const trajectoryOf = (idx: number): keyof typeof TRAJECTORIES => {
    const r = idx % 9;
    if (r < 4) return 'improving';
    if (r < 6) return 'declining';
    return 'stable';
  };

  let created = 0;

  for (let i = 0; i < companies.length; i++) {
    const { id: companyId, name } = companies[i];
    const traj = trajectoryOf(i);
    const offsets = TRAJECTORIES[traj];

    // Get the current (latest) scorecard for this company
    const currentSnap = await db
      .collection('scorecards')
      .where('companyId', '==', companyId)
      .get();

    if (currentSnap.empty) {
      console.log(`  ⚠  ${name} — no current scorecard, skipping`);
      continue;
    }

    const currentDoc = currentSnap.docs
      .map(d => d.data())
      .sort((a, b) => (b.calculatedAt as string).localeCompare(a.calculatedAt as string))[0];

    const currentScore = currentDoc.overallScore as number;
    const sector       = currentDoc.sector as string | undefined;

    // Check if historical periods already exist
    const existingPeriods = new Set(currentSnap.docs.map(d => d.data().submissionPeriod as string));

    for (let p = 0; p < PERIODS.length; p++) {
      const { period, calculatedAt } = PERIODS[p];

      if (existingPeriods.has(period)) {
        console.log(`  →  ${name} [${period}] already exists, skipping`);
        continue;
      }

      const score = clamp(currentScore + offsets[p]);

      await db.collection('scorecards').add({
        companyId,
        sector: sector ?? 'other',
        overallScore:    score,
        classification:  classify(score),
        sdgScores:       buildSdgScores(score),
        submissionPeriod: period,
        calculatedAt,
        seededHistory: true,
      });

      created++;
    }

    console.log(`  ✓  ${name.padEnd(35)} ${traj.padEnd(10)}  current=${currentScore.toFixed(2)}`);
  }

  console.log(`\n✅ Done. ${created} historical scorecard documents created.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
