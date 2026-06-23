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

const db        = admin.firestore();
const adminAuth = admin.auth();

async function main() {
  console.log('\nAssigning Lerato Dlamini to all unassigned companies...\n');

  const pmUser  = await adminAuth.getUserByEmail('pm@investscore.co.za');
  const pmUid   = pmUser.uid;
  const pmEmail = 'pm@investscore.co.za';
  const pmName  = 'Lerato Dlamini';
  console.log(`PM uid: ${pmUid}\n`);

  const snap = await db.collection('companies').get();
  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.assignedPmEmail) {
      batch.update(doc.ref, {
        assignedPmUid:   pmUid,
        assignedPmEmail: pmEmail,
        assignedPmName:  pmName,
        updatedAt:       new Date().toISOString(),
      });
      console.log(`  → ${data.name}`);
      count++;
    }
  }

  if (count === 0) {
    console.log('  All companies already have a PM assigned.');
  } else {
    await batch.commit();
    console.log(`\n✅ Assigned Lerato to ${count} companies.\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
