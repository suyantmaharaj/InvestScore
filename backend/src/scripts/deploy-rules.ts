import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
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

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;

async function getAccessToken(): Promise<string> {
  const cred = (admin.app().options.credential as admin.credential.Credential);
  const token = await cred.getAccessToken();
  return token.access_token;
}

function httpsRequest(options: https.RequestOptions, body?: string): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const rulesPath = path.resolve('/Users/SuyantM/InvestScore/firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
  console.log(`\nDeploying Firestore rules from:\n  ${rulesPath}\n`);

  const token = await getAccessToken();

  // Step 1: Create a new ruleset
  const rulesetBody = JSON.stringify({
    source: {
      files: [{
        name: 'firestore.rules',
        content: rulesContent,
      }],
    },
  });

  const createResult = await httpsRequest({
    hostname: 'firebaserules.googleapis.com',
    path:     `/v1/projects/${PROJECT_ID}/rulesets`,
    method:   'POST',
    headers:  {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, rulesetBody);

  if (createResult.status !== 200) {
    throw new Error(`Failed to create ruleset: ${createResult.status} ${createResult.data}`);
  }

  const ruleset = JSON.parse(createResult.data);
  const rulesetName = ruleset.name as string;
  console.log(`  ✓ Ruleset created: ${rulesetName}`);

  // Step 2: Update the cloud.firestore release to point at the new ruleset
  const releaseBody = JSON.stringify({
    release: {
      name:        `projects/${PROJECT_ID}/releases/cloud.firestore`,
      rulesetName,
    },
  });

  const releaseResult = await httpsRequest({
    hostname: 'firebaserules.googleapis.com',
    path:     `/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
    method:   'PATCH',
    headers:  {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }, releaseBody);

  if (releaseResult.status !== 200) {
    // If PATCH fails (release might not exist yet), try PUT
    const putResult = await httpsRequest({
      hostname: 'firebaserules.googleapis.com',
      path:     `/v1/projects/${PROJECT_ID}/releases`,
      method:   'POST',
      headers:  {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, releaseBody);

    if (putResult.status !== 200) {
      throw new Error(`Failed to update release: ${releaseResult.status} ${releaseResult.data}\nPOST attempt: ${putResult.status} ${putResult.data}`);
    }
    console.log(`  ✓ Release created.`);
  } else {
    console.log(`  ✓ Release updated.`);
  }

  console.log(`\n✅ Firestore rules deployed to project: ${PROJECT_ID}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('\n✗ Deploy failed:', err.message);
  process.exit(1);
});
