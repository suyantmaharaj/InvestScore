import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { calculateScore, calculateSDGScores } from '../services/scoring.service';

const router = Router();

// GET /api/submissions/draft?companyId=xxx
router.get('/draft', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) return res.json({ draft: null });

    const snap = await db
      .collection('submissions')
      .where('companyId', '==', companyId)
      .where('status', '==', 'draft')
      .get();

    if (snap.empty) return res.json({ draft: null });

    // Sort in JS to avoid composite index requirement
    const sorted = snap.docs
      .map(d => d.data())
      .sort((a, b) => (b.updatedAt || b.submittedAt).localeCompare(a.updatedAt || a.submittedAt));

    return res.json({ draft: sorted[0] });
  } catch (err) {
    console.error('GET /draft error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/submissions/save-draft
router.post('/save-draft', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, data, period } = req.body;

    if (!companyId || !data) {
      return res.status(400).json({ error: 'companyId and data are required.' });
    }

    const existing = await db
      .collection('submissions')
      .where('companyId', '==', companyId)
      .where('status', '==', 'draft')
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({
        data,
        updatedAt: new Date().toISOString(),
      });
      return res.json({ id: existing.docs[0].id, status: 'draft' });
    }

    const docRef = db.collection('submissions').doc();
    await docRef.set({
      id:          docRef.id,
      companyId,
      period:      period || 'Q2 2026',
      status:      'draft',
      data,
      submittedAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });

    return res.json({ id: docRef.id, status: 'draft' });
  } catch (err) {
    console.error('POST /save-draft error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/submissions/submit
router.post('/submit', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, data, period } = req.body;

    if (!companyId || !data) {
      return res.status(400).json({ error: 'companyId and data are required.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const sector = companySnap.data()!.sector as string;

    const kpiInputs = Object.entries(data).map(([kpiId, value]) => ({
      kpiId,
      value: value as number | null,
    }));

    const { overallScore, classification, kpiResults } = calculateScore(sector as any, kpiInputs);
    const sdgScores = calculateSDGScores(kpiResults);

    const now          = new Date().toISOString();
    const submissionId = `sub_${companyId}_${Date.now()}`;
    const scorecardId  = `scorecard_${companyId}_${Date.now()}`;

    await db.collection('submissions').doc(submissionId).set({
      id:          submissionId,
      companyId,
      period:      period || 'Q2 2026',
      status:      'scored',
      data,
      submittedAt: now,
      scoredAt:    now,
    });

    await db.collection('scorecards').doc(scorecardId).set({
      id:               scorecardId,
      companyId,
      submissionId,
      overallScore,
      classification,
      sdgScores,
      calculatedAt:     now,
      submissionPeriod: period || 'Q2 2026',
    });

    // Delete any draft
    const drafts = await db
      .collection('submissions')
      .where('companyId', '==', companyId)
      .where('status', '==', 'draft')
      .get();

    if (!drafts.empty) {
      const batch = db.batch();
      drafts.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    return res.json({ success: true, submissionId, scorecardId, overallScore, classification });
  } catch (err) {
    console.error('POST /submit error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok', route: 'submission' }));

export default router;
