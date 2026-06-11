import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { writeAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/targets/:companyId — load targets for a company
router.get('/:companyId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const snap = await db.collection('targets').doc(companyId).get();
    if (!snap.exists) return res.json({ targets: {} });
    return res.json({ targets: snap.data()?.targets ?? {} });
  } catch (err) {
    console.error('Load targets error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/targets/:companyId — PM sets targets
router.put('/:companyId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const { targets } = req.body as { targets: Record<string, number> };

    if (!targets || typeof targets !== 'object') {
      return res.status(400).json({ error: 'targets object required.' });
    }

    await db.collection('targets').doc(companyId).set({
      companyId,
      targets,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.uid,
    }, { merge: true });

    await writeAuditLog({
      action:    'target_set',
      actor:     req.user!.email,
      actorRole: req.user!.role,
      companyId,
      detail:    `PM set ${Object.keys(targets).length} SDG targets for company ${companyId}`,
      metadata:  { targets },
    });

    return res.json({ ok: true, targets });
  } catch (err) {
    console.error('Save targets error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'targets' }));

export default router;
