import * as admin from 'firebase-admin';
import * as https from 'https';
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

function get(path: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'firebaserules.googleapis.com',
      path,
      headers: { Authorization: `Bearer ${token}` },
    }, res => {
      let d = ''; res.on('data', c => (d += c)); res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const tok    = await (admin.app().options.credential as any).getAccessToken();
  const token  = tok.access_token as string;
  const proj   = process.env.FIREBASE_PROJECT_ID!;

  const releaseRaw = await get(`/v1/projects/${proj}/releases/cloud.firestore`, token);
  const release    = JSON.parse(releaseRaw);
  console.log('\nActive ruleset name:', release.rulesetName);

  const rulesetRaw = await get(`/v1/${release.rulesetName}`, token);
  const ruleset    = JSON.parse(rulesetRaw);
  const content    = ruleset.source?.files?.[0]?.content as string ?? '';

  if (content.includes('isPM()')) {
    console.log('✅  Rules contain isPM() — custom rules ARE deployed.\n');
  } else {
    console.log('✗   Rules do NOT contain isPM() — default/empty rules are still active.\n');
  }

  console.log('--- First 200 chars ---');
  console.log(content.slice(0, 200));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
