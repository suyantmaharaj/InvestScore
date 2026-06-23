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

const DEMO_PENDING = [
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

async function main() {
  console.log('\nAdding demo pending registrations...\n');
  const batch = db.batch();
  for (const reg of DEMO_PENDING) {
    const ref = db.collection('pendingRegistrations').doc();
    batch.set(ref, reg);
    console.log(`  + ${reg.companyName} (${reg.email})`);
  }
  await batch.commit();
  console.log(`\n✅ Added ${DEMO_PENDING.length} pending registrations.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
