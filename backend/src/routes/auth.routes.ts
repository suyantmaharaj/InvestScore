import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/firebase.service';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
// Saves a pending registration — does NOT create a Firebase Auth user yet
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyName, industry, description } = req.body;

    if (!name || !email || !password || !companyName || !industry || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!EMAIL_RE.test(String(email))) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await db
      .collection('pendingRegistrations')
      .where('email', '==', String(email).toLowerCase().trim())
      .where('status', '==', 'pending')
      .get();

    if (!existing.empty) {
      return res.status(409).json({
        error: 'A registration request for this email is already pending.',
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const docRef = db.collection('pendingRegistrations').doc();
    await docRef.set({
      id:           docRef.id,
      name:         String(name).trim(),
      email:        String(email).toLowerCase().trim(),
      passwordHash,
      companyName:  String(companyName).trim(),
      industry:     String(industry).trim(),
      description:  String(description).trim(),
      requestedAt:  new Date().toISOString(),
      status:       'pending',
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
