import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/engagement/:companyId — list entries sorted newest-first (JS sort, no composite index)
router.get('/:companyId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const snap = await db.collection('engagementLogs')
      .where('companyId', '==', companyId)
      .get();
    const entries = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.date ?? '').localeCompare(a.date ?? ''));
    return res.json({ entries });
  } catch (err) {
    console.error('GET /engagement error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/engagement — create new entry
router.post('/', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, type, date, notes, commitments } = req.body as {
      companyId:   string;
      type:        string;
      date:        string;
      notes:       string;
      commitments: string[];
    };

    if (!companyId || !type || !date) {
      return res.status(400).json({ error: 'companyId, type, date required.' });
    }

    const ref = await db.collection('engagementLogs').add({
      companyId,
      type,
      date,
      notes:       notes ?? '',
      commitments: commitments ?? [],
      createdAt:   new Date().toISOString(),
      createdBy:   req.user!.email,
      pmUid:       req.user!.uid,
    });

    return res.status(201).json({ ok: true, id: ref.id });
  } catch (err) {
    console.error('POST /engagement error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/engagement/:entryId — delete entry
router.delete('/:entryId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    await db.collection('engagementLogs').doc(String(req.params.entryId)).delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /engagement error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
