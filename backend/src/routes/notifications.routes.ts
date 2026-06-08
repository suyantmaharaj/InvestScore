import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Called by other routes when trigger events occur
export async function createNotification(payload: {
  type:         'submission' | 'classification_change' | 'registration_approved' | 'risk_alert';
  title:        string;
  body:         string;
  companyId?:   string;
  companyName?: string;
  severity:     'info' | 'warning' | 'critical';
  forRole:      'pm' | 'admin' | 'all';
  metadata?:    Record<string, unknown>;
}) {
  const docRef = db.collection('notifications').doc();
  await docRef.set({
    id:        docRef.id,
    ...payload,
    read:      false,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const role  = req.user!.role;
    const limit = parseInt((req.query.limit as string) || '50', 10);

    const snap = await db.collection('notifications')
      .where('forRole', 'in', [role, 'all'])
      .get();

    let notifications = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    if (req.query.unread === 'true') {
      notifications = notifications.filter((n: any) => !n.read);
    }

    return res.json({ notifications });
  } catch (err) {
    console.error('GET /notifications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/notifications/:id/read ─────────────────────────────────────────
router.post('/:id/read', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    await db.collection('notifications').doc(req.params.id as string).update({
      read:   true,
      readAt: new Date().toISOString(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /notifications/:id/read error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/notifications/read-all ─────────────────────────────────────────
router.post('/read-all', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const snap = await db.collection('notifications')
      .where('forRole', 'in', [role, 'all'])
      .get();

    const unread = snap.docs.filter(d => !d.data().read);
    if (unread.length === 0) return res.json({ success: true, count: 0 });

    const batch = db.batch();
    const now   = new Date().toISOString();
    unread.forEach(d => batch.update(d.ref, { read: true, readAt: now }));
    await batch.commit();

    return res.json({ success: true, count: unread.length });
  } catch (err) {
    console.error('POST /notifications/read-all error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
