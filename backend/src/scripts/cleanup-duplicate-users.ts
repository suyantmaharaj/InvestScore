/**
 * Removes stale Firestore user documents left over from multiple seed runs.
 * Each seed run deletes + recreates Firebase Auth users (new UID), leaving
 * orphaned docs under old UIDs. This script keeps only the doc that matches
 * the current Firebase Auth UID for each email.
 *
 * Run: npx ts-node src/scripts/cleanup-duplicate-users.ts
 */
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
  console.log('\nScanning for duplicate user documents...\n');

  const snap = await db.collection('users').get();
  const docs  = snap.docs.map(d => ({ docId: d.id, ...d.data() as any }));

  // Group by email
  const byEmail: Record<string, typeof docs> = {};
  for (const d of docs) {
    const email = d.email as string;
    if (!email) continue;
    if (!byEmail[email]) byEmail[email] = [];
    byEmail[email].push(d);
  }

  let deleted = 0;
  for (const [email, group] of Object.entries(byEmail)) {
    if (group.length <= 1) continue;

    // Find the real current UID from Firebase Auth
    let realUid: string | null = null;
    try {
      const authUser = await adminAuth.getUserByEmail(email);
      realUid = authUser.uid;
    } catch {
      console.warn(`  Warning: ${email} not found in Firebase Auth — skipping`);
      continue;
    }

    for (const d of group) {
      if (d.docId !== realUid) {
        await db.collection('users').doc(d.docId).delete();
        console.log(`  Deleted stale doc for ${email} (uid: ${d.docId})`);
        deleted++;
      } else {
        console.log(`  Kept   current doc for ${email} (uid: ${d.docId})`);
      }
    }
  }

  if (deleted === 0) console.log('  No duplicates found.');
  console.log(`\n✅ Done. Removed ${deleted} stale documents.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
