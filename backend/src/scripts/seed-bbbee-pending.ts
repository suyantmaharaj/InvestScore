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

async function main() {
  const companyId   = 'company_001';
  const companyName = 'Khaya Capital';
  const now         = new Date().toISOString();

  // Supersede any existing pending verifications for this company
  const existing = await db.collection('bbbeeVerifications')
    .where('companyId', '==', companyId)
    .get();

  const pendingDocs = existing.docs.filter(d => d.data().status === 'pending');
  if (pendingDocs.length > 0) {
    console.log(`  Superseding ${pendingDocs.length} existing pending record(s)...`);
    await Promise.all(pendingDocs.map(d => d.ref.update({ status: 'superseded' })));
  }

  const entry = {
    companyId,
    companyName,
    filename:        'Certficate.png',
    originalName:    'Khaya Capital B-BBEE Certificate.png',
    fileSize:        245120,
    fileType:        'image/png',
    storagePath:     `bbbee/${companyId}/Certficate.png`,
    downloadUrl:     '/Certficate.png',
    claimedLevel:    4,
    status:          'pending',
    uploadedBy:      'sme1@investscore.co.za',
    uploadedAt:      now,
    submittedAt:     now,
    reviewedBy:      null,
    reviewedAt:      null,
    rejectionReason: null,
  };

  const ref = await db.collection('bbbeeVerifications').add(entry);

  await db.collection('companies').doc(companyId).update({
    bbbeeVerificationStatus: 'pending',
    bbbeeVerificationId:     ref.id,
    bbbeeClaimedLevel:       4,
  });

  console.log(`\n✅ Seeded pending B-BBEE verification for ${companyName}`);
  console.log(`   Document ID: ${ref.id}`);
  console.log(`   Claimed Level: 4\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
