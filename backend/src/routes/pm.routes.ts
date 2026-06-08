import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/pm/notes/:companyId
router.get('/notes/:companyId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('pmNotes').doc(req.params.companyId as string).get();
    return res.json({ notes: snap.exists ? snap.data()?.notes : '' });
  } catch (err) {
    console.error('GET /pm/notes error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/pm/notes/:companyId
router.put('/notes/:companyId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    await db.collection('pmNotes').doc(req.params.companyId as string).set({
      companyId:  req.params.companyId,
      notes:      req.body.notes || '',
      updatedAt:  new Date().toISOString(),
      updatedBy:  req.user!.email,
    }, { merge: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /pm/notes error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok', route: 'pm' }));

export default router;
