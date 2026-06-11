import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/watchlist - load current PM's watchlist
router.get('/', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const uid  = req.user!.uid;
    const snap = await db.collection('pmWatchlists').doc(uid).get();
    return res.json({ watchlist: snap.exists ? (snap.data()?.watchlist ?? []) : [] });
  } catch (err) {
    console.error('GET /watchlist error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/watchlist - replace watchlist
router.put('/', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { watchlist } = req.body as { watchlist: string[] };
    if (!Array.isArray(watchlist)) {
      return res.status(400).json({ error: 'watchlist array required.' });
    }
    await db.collection('pmWatchlists').doc(uid).set(
      { watchlist, updatedAt: new Date().toISOString(), updatedBy: req.user!.email },
      { merge: true }
    );
    return res.json({ ok: true, watchlist });
  } catch (err) {
    console.error('PUT /watchlist error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
