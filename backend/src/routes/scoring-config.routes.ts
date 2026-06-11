import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { SECTOR_WEIGHTS, KPI_THRESHOLDS } from '../constants/scoring.constants';
import { invalidateConfigCache } from '../services/scoring.service';
import { writeAuditLog } from '../services/audit.service';

const router    = Router();
const CONFIG_DOC = db.collection('config').doc('scoringConfig');
const AUDIT_COL  = db.collection('scoringConfigAudit');

// GET /api/scoring-config — current config or hardcoded defaults
router.get('/', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const snap = await CONFIG_DOC.get();
    if (snap.exists) {
      const data = snap.data()!;
      return res.json({
        sectorWeights: data.sectorWeights,
        kpiThresholds: data.kpiThresholds,
        isDefault:     false,
        updatedAt:     data.updatedAt,
        updatedBy:     data.updatedBy,
        history:       ((data.history as any[]) || []).slice(-10).reverse(),
      });
    }
    return res.json({
      sectorWeights: SECTOR_WEIGHTS,
      kpiThresholds: KPI_THRESHOLDS,
      isDefault:     true,
      updatedAt:     null,
      updatedBy:     null,
      history:       [],
    });
  } catch (err) {
    console.error('Scoring config GET error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/scoring-config — save with mandatory change reason
router.put('/', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { sectorWeights, kpiThresholds, reason } = req.body;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ error: 'Change reason is required.' });
  }
  if (!sectorWeights || !kpiThresholds) {
    return res.status(400).json({ error: 'sectorWeights and kpiThresholds are required.' });
  }

  const uid = req.user!.uid;
  const by  = req.user!.email;
  const now = new Date().toISOString();

  try {
    const prevSnap = await CONFIG_DOC.get();
    const prev     = prevSnap.exists ? prevSnap.data()! : {};
    const history: any[] = (prev.history as any[]) || [];

    history.push({
      changedAt:    now,
      changedBy:    by,
      changedByUid: uid,
      reason:       reason.trim(),
      sectorWeights: prev.sectorWeights || SECTOR_WEIGHTS,
      kpiThresholds: prev.kpiThresholds || KPI_THRESHOLDS,
    });

    await CONFIG_DOC.set({
      sectorWeights,
      kpiThresholds,
      updatedAt:    now,
      updatedBy:    by,
      updatedByUid: uid,
      history:      history.slice(-10),
    });

    await AUDIT_COL.add({
      action:       'update',
      changedAt:    now,
      changedBy:    by,
      changedByUid: uid,
      reason:       reason.trim(),
    });

    invalidateConfigCache();

    await writeAuditLog({
      action:    'scoring_config_updated',
      actor:     by,
      actorRole: 'admin',
      detail:    `Scoring config updated: ${reason.trim()}`,
      metadata:  { reason: reason.trim(), updatedAt: now },
    });

    return res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('Scoring config PUT error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/scoring-config — reset to hardcoded defaults
router.delete('/', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ error: 'Change reason is required.' });
  }

  const uid = req.user!.uid;
  const by  = req.user!.email;
  const now = new Date().toISOString();

  try {
    const prevSnap = await CONFIG_DOC.get();
    if (prevSnap.exists) {
      const prev = prevSnap.data()!;
      await AUDIT_COL.add({
        action:       'reset',
        changedAt:    now,
        changedBy:    by,
        changedByUid: uid,
        reason:       reason.trim(),
        previousConfig: {
          sectorWeights: prev.sectorWeights,
          kpiThresholds: prev.kpiThresholds,
        },
      });
    }
    await CONFIG_DOC.delete();
    invalidateConfigCache();

    await writeAuditLog({
      action:    'scoring_config_reset',
      actor:     by,
      actorRole: 'admin',
      detail:    `Scoring config reset to defaults: ${reason.trim()}`,
      metadata:  { reason: reason.trim(), resetAt: now },
    });

    return res.json({ success: true, resetAt: now });
  } catch (err) {
    console.error('Scoring config DELETE error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
