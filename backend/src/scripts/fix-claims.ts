/**
 * Patches custom claims for existing seeded users without re-seeding all data.
 * Run once: npx ts-node src/scripts/fix-claims.ts
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

const adminAuth = admin.auth();
const db        = admin.firestore();

const USERS_TO_FIX = [
  { email: 'sme1@investscore.co.za', role: 'sme',   companyId: 'company_001' },
  { email: 'sme2@investscore.co.za', role: 'sme',   companyId: 'company_002' },
  { email: 'sme3@investscore.co.za', role: 'sme',   companyId: 'company_003' },
  { email: 'pm@investscore.co.za',   role: 'pm',    companyId: null          },
  { email: 'admin@investscore.co.za', role: 'admin', companyId: null          },
];

async function fixClaims() {
  console.log('Patching custom claims for seeded users...\n');

  for (const u of USERS_TO_FIX) {
    try {
      const user   = await adminAuth.getUserByEmail(u.email);
      const claims = {
        role:      u.role,
        ...(u.companyId ? { companyId: u.companyId } : {}),
      };
      await adminAuth.setCustomUserClaims(user.uid, claims);

      // Keep Firestore users doc in sync
      await db.collection('users').doc(user.uid).update({
        role:      u.role,
        companyId: u.companyId ?? null,
      });

      console.log(`  Fixed: ${u.email}  →  ${JSON.stringify(claims)}`);
    } catch (err: any) {
      console.error(`  FAILED: ${u.email} — ${err?.message ?? err}`);
    }
  }

  console.log('\nDone. Users must sign out and back in for new claims to take effect.');
  process.exit(0);
}

fixClaims();
