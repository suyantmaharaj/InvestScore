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

async function check() {
  console.log('=== USERS ===');
  const users = await db.collection('users').get();
  users.docs.forEach(d => {
    const data = d.data();
    console.log(`uid:${d.id} | ${data.email} | role:${data.role} | companyId:${data.companyId}`);
  });

  console.log('\n=== SCORECARDS ===');
  const cards = await db.collection('scorecards').get();
  cards.docs.forEach(d => {
    const data = d.data();
    console.log(`${d.id} | companyId:${data.companyId} | score:${data.overallScore}`);
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
