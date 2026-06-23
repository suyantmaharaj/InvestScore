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

// ── Approved — one per seeded company (shows existing portfolio) ──────────────
const APPROVED = [
  { name: 'Sipho Nkosi',           email: 'sme1@investscore.co.za',       companyName: 'Khaya Capital',          industry: 'financial_services' },
  { name: 'Amahle Zulu',           email: 'sme2@investscore.co.za',       companyName: 'Nkosi Manufacturing',    industry: 'manufacturing'       },
  { name: 'Thabo Mokoena',         email: 'sme3@investscore.co.za',       companyName: 'Tshiamo Tech',           industry: 'ict'                 },
  { name: 'Tony Stark-Dlamini',    email: 'sme.stark@investscore.co.za',  companyName: 'Stark Industries SA',    industry: 'manufacturing'       },
  { name: 'T\'Challa Ndlovu',      email: 'sme.wakanda@investscore.co.za', companyName: 'Wakanda Capital',       industry: 'financial_services'  },
  { name: 'Natasha Romanoff',      email: 'sme.romanoff@investscore.co.za', companyName: 'Romanoff & Associates', industry: 'logistics'          },
  { name: 'Bruce Banner',          email: 'sme.banner@investscore.co.za', companyName: 'Banner Green Tech',      industry: 'infrastructure'      },
  { name: 'Steve Rogers',          email: 'sme.rogers@investscore.co.za', companyName: 'Rogers Housing Solutions', industry: 'housing'           },
  { name: 'Wanda Maximoff',        email: 'sme.maximoff@investscore.co.za', companyName: 'Maximoff Energy',      industry: 'infrastructure'      },
  { name: 'Carol Danvers',         email: 'sme.danvers@investscore.co.za', companyName: 'Danvers Logistics',     industry: 'logistics'           },
  { name: 'Peter Parker',          email: 'sme.parker@investscore.co.za', companyName: 'Parker Retail Group',   industry: 'retail'              },
  { name: 'Thor Odinson',          email: 'sme.odinson@investscore.co.za', companyName: 'Odinson Agri',          industry: 'other'               },
].map((r, i) => ({
  ...r,
  description: `Portfolio company — approved during onboarding.`,
  requestedAt: new Date(Date.now() - (i + 15) * 24 * 60 * 60 * 1000).toISOString(),
  status:      'approved',
  reviewedAt:  new Date(Date.now() - (i + 10) * 24 * 60 * 60 * 1000).toISOString(),
  reviewedBy:  'admin@investscore.co.za',
}));

// ── Pending ──────────────────────────────────────────────────────────────────
const PENDING = [
  {
    name:        'Zanele Mokoena',
    email:       'zanele@greenpulse.co.za',
    companyName: 'GreenPulse Logistics',
    industry:    'logistics',
    description: 'Sustainable last-mile delivery network focused on electric vehicles and carbon-neutral operations across Gauteng.',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status:      'pending',
  },
  {
    name:        'Thando Sibeko',
    email:       'thando@afrohive.co.za',
    companyName: 'AfroHive Technologies',
    industry:    'ict',
    description: 'Rural connectivity platform providing affordable broadband and digital literacy training to underserved communities.',
    requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status:      'pending',
  },
  {
    name:        'Nomvula Dlamini',
    email:       'nomvula@umzinze.co.za',
    companyName: 'Umzinze Housing Co-op',
    industry:    'housing',
    description: 'Worker-owned cooperative developing affordable rental housing and homeownership programmes in Cape Town\'s peri-urban areas.',
    requestedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status:      'pending',
  },
];

// ── Rejected ──────────────────────────────────────────────────────────────────
const REJECTED = [
  {
    name:        'Marcus van der Berg',
    email:       'marcus@mvdg.co.za',
    companyName: 'MVDG Consulting',
    industry:    'financial_services',
    description: 'Financial advisory firm focused on high-net-worth individuals.',
    requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status:      'rejected',
    reviewedAt:  new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy:  'admin@investscore.co.za',
    rejectionReason: 'Does not meet SME criteria — company revenue exceeds the programme threshold.',
  },
  {
    name:        'Pieter Joubert',
    email:       'pieter@joubert-trading.co.za',
    companyName: 'Joubert Trading CC',
    industry:    'retail',
    description: 'General trading and import/export business.',
    requestedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    status:      'rejected',
    reviewedAt:  new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedBy:  'admin@investscore.co.za',
    rejectionReason: 'Incomplete application — registration documents not submitted within the required timeframe.',
  },
];

async function main() {
  console.log('\nSeeding registration records...\n');

  const batch = db.batch();

  for (const r of [...APPROVED, ...PENDING, ...REJECTED]) {
    const ref = db.collection('pendingRegistrations').doc();
    batch.set(ref, r);
    console.log(`  [${r.status.toUpperCase().padEnd(8)}] ${r.companyName}`);
  }

  await batch.commit();
  console.log(`\n✅ Added ${APPROVED.length} approved, ${PENDING.length} pending, ${REJECTED.length} rejected.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
