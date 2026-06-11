import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { calculateScore, calculateSDGScores } from '../services/scoring.service';
import { createNotification } from './notifications.routes';
import { writeAuditLog } from '../services/audit.service';

const router = Router();

/**
 * Computes live per-SDG sector averages from the latest scorecard of each
 * same-sector company (excluding the submitting company to avoid circularity).
 * Falls back to static constants when fewer than 2 peers have scorecards.
 */
async function computeLiveSectorAverages(
  sector: string,
  excludeCompanyId: string,
): Promise<Record<number, number> | undefined> {
  try {
    const companiesSnap = await db.collection('companies')
      .where('sector', '==', sector)
      .where('status', '==', 'active')
      .get();

    const peerIds = companiesSnap.docs
      .map(d => d.id)
      .filter(id => id !== excludeCompanyId);

    if (peerIds.length === 0) return undefined;

    // Single-field `in` query - no composite index needed
    const scorecardsSnap = await db.collection('scorecards')
      .where('companyId', 'in', peerIds.slice(0, 30))
      .get();

    if (scorecardsSnap.empty) return undefined;

    // Take latest scorecard per company
    const latestPerCompany = new Map<string, any>();
    for (const doc of scorecardsSnap.docs) {
      const sc = doc.data();
      const existing = latestPerCompany.get(sc.companyId);
      if (!existing || sc.calculatedAt > existing.calculatedAt) {
        latestPerCompany.set(sc.companyId, sc);
      }
    }

    const scorecards = Array.from(latestPerCompany.values());
    if (scorecards.length < 2) return undefined; // not enough peers for a meaningful average

    // Compute per-SDG mean
    const sdgTotals = new Map<number, { sum: number; count: number }>();
    for (const sc of scorecards) {
      if (!Array.isArray(sc.sdgScores)) continue;
      for (const sdgScore of sc.sdgScores) {
        const entry = sdgTotals.get(sdgScore.sdgId) ?? { sum: 0, count: 0 };
        entry.sum   += sdgScore.score;
        entry.count += 1;
        sdgTotals.set(sdgScore.sdgId, entry);
      }
    }

    const averages: Record<number, number> = {};
    for (const [sdgId, { sum, count }] of sdgTotals) {
      averages[sdgId] = Math.round((sum / count) * 100) / 100;
    }

    return Object.keys(averages).length > 0 ? averages : undefined;
  } catch (err) {
    console.error('computeLiveSectorAverages error (non-fatal):', err);
    return undefined;
  }
}

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
    const liveSectorAvg = await computeLiveSectorAverages(sector, companyId);
    const sdgScores = calculateSDGScores(kpiResults, sector, liveSectorAvg);

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

    await writeAuditLog({
      action:     'submission_scored',
      actor:      req.user!.email,
      actorRole:  'sme',
      companyId,
      companyName: companySnap.data()!.name,
      detail:     `Score calculated: ${overallScore.toFixed(2)} (${classification}) for ${period || 'Q2 2026'}`,
      metadata:   { overallScore, classification, period: period || 'Q2 2026', submissionId, scorecardId },
    });

    // Notifications
    const company = companySnap.data()!;
    try {
      await createNotification({
        type:        'submission',
        title:       'New data submission',
        body:        `${company.name} has submitted their ${period || 'Q2 2026'} SDG data. Overall score: ${overallScore.toFixed(1)} (${classification} Impact).`,
        companyId,
        companyName: company.name,
        severity:    'info',
        forRole:     'pm',
        metadata:    { overallScore, classification, period },
      });

      if (classification === 'Low' || overallScore < 1.8) {
        await createNotification({
          type:        'risk_alert',
          title:       `Risk alert: ${company.name}`,
          body:        `${company.name} scored ${overallScore.toFixed(1)} on their latest submission - below the 1.8 risk threshold. Immediate portfolio review recommended.`,
          companyId,
          companyName: company.name,
          severity:    'critical',
          forRole:     'pm',
          metadata:    { overallScore, classification },
        });
      }

      // Classification change detection
      const prevSnap = await db.collection('scorecards')
        .where('companyId', '==', companyId)
        .get();

      const prevScorecards = prevSnap.docs
        .map(d => d.data())
        .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));

      if (prevScorecards.length >= 2) {
        const prevClassification = prevScorecards[1].classification;
        if (prevClassification !== classification) {
          const improved = classification === 'High' || (classification === 'Medium' && prevClassification === 'Low');
          await createNotification({
            type:        'classification_change',
            title:       `${company.name} changed classification`,
            body:        `${company.name} moved from ${prevClassification} Impact to ${classification} Impact. ${improved ? 'This is a positive improvement.' : 'This requires attention.'}`,
            companyId,
            companyName: company.name,
            severity:    improved ? 'info' : 'warning',
            forRole:     'pm',
            metadata:    { from: prevClassification, to: classification },
          });
        }
      }
    } catch (notifErr) {
      console.error('Notification creation error (non-fatal):', notifErr);
    }

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
