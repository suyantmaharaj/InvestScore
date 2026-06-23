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

const MISSING_USERS = [
  { email: 'sme4@investscore.co.za', password: 'SME4@2026!', name: 'Nokwanda Dube',   companyId: 'company_004' },
  { email: 'sme5@investscore.co.za', password: 'SME5@2026!', name: 'Mandla Sithole',  companyId: 'company_005' },
  { email: 'sme6@investscore.co.za', password: 'SME6@2026!', name: 'Refilwe Moagi',   companyId: 'company_006' },
  { email: 'sme7@investscore.co.za', password: 'SME7@2026!', name: 'Tshepo Letsie',   companyId: 'company_007' },
  { email: 'sme8@investscore.co.za', password: 'SME8@2026!', name: 'Ziyanda Ntuli',   companyId: 'company_008' },
  { email: 'sme9@investscore.co.za', password: 'SME9@2026!', name: 'Lungelo Dlamini', companyId: 'company_009' },
];

async function main() {
  console.log('\nCreating missing SME users...\n');

  for (const u of MISSING_USERS) {
    try {
      try {
        const existing = await adminAuth.getUserByEmail(u.email);
        await db.collection('users').doc(existing.uid).delete();
        await adminAuth.deleteUser(existing.uid);
      } catch {}

      const user = await adminAuth.createUser({
        email:         u.email,
        password:      u.password,
        displayName:   u.name,
        emailVerified: true,
      });

      await adminAuth.setCustomUserClaims(user.uid, { role: 'sme', companyId: u.companyId });

      await db.collection('users').doc(user.uid).set({
        uid:       user.uid,
        email:     u.email,
        name:      u.name,
        role:      'sme',
        companyId: u.companyId,
        createdAt: new Date().toISOString(),
      });

      console.log(`  ✓ ${u.email}  →  ${u.companyId}`);
    } catch (err: any) {
      console.error(`  ✗ ${u.email}: ${err.message}`);
    }
  }

  console.log('\n✅ Done. 6 users created — total SMEs should now be 18.\n');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
