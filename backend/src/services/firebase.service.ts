// dotenv must be loaded before this module initialises — use require() so it
// is not hoisted like an import statement would be in CommonJS output.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const db        = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
