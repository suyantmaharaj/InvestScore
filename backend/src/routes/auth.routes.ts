import { Router, Request, Response } from 'express';
import { db } from '../services/firebase.service';

const router = Router();

// POST /api/auth/register
// Saves a pending registration - does NOT create a Firebase Auth user yet
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName, industry, description } = req.body;

    if (!name || !email || !password || !companyName || !industry || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existing = await db
      .collection('pendingRegistrations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get();

    if (!existing.empty) {
      return res.status(409).json({
        error: 'A registration request for this email is already pending.',
      });
    }

    const docRef = db.collection('pendingRegistrations').doc();
    await docRef.set({
      id:          docRef.id,
      name,
      email,
      password,   // stored temporarily for Admin to use when creating the account
      companyName,
      industry,
      description,
      requestedAt: new Date().toISOString(),
      status:      'pending',
    });

    return res.status(201).json({ success: true, message: 'Registration request submitted.' });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', route: 'auth' });
});

export default router;
