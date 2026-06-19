import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { KPI_LIST } from '../constants/kpi.constants';
import { KPI_THRESHOLDS, INVERTED_KPIS, SECTOR_WEIGHTS, SectorType } from '../constants/scoring.constants';
import { SDG_LIST } from '../constants/sdg.constants';

const router = Router();
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function formatSubmissionPeriod(isoDate: string): string {
  const d = new Date(isoDate);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

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

// GET /api/pm/drilldown/:companyId/:sdgId
router.get('/drilldown/:companyId/:sdgId', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;
    const sdgId     = parseInt(req.params['sdgId'] as string);

    if (isNaN(sdgId) || sdgId < 1 || sdgId > 17) {
      return res.status(400).json({ error: 'sdgId must be between 1 and 17.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) return res.status(404).json({ error: 'Company not found.' });
    const company = companySnap.data()!;

    // Single where clauses only — filter in JS to avoid composite index
    const [subSnap, scoreSnap] = await Promise.all([
      db.collection('submissions').where('companyId', '==', companyId).get(),
      db.collection('scorecards').where('companyId', '==', companyId).get(),
    ]);

    const scoredSubs = subSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((s: any) => s.status === 'scored')
      .sort((a: any, b: any) =>
        (b.scoredAt || b.submittedAt || '').localeCompare(a.scoredAt || a.submittedAt || '')
      );

    const latestSub      = scoredSubs[0] ?? null;
    const submissionData = latestSub?.data ?? {};

    const sortedScores = scoreSnap.docs
      .map(d => d.data())
      .sort((a: any, b: any) => b.calculatedAt.localeCompare(a.calculatedAt));

    const latestScorecard = sortedScores[0];
    const prevScorecard   = sortedScores[1];

    const sdgData = latestScorecard?.sdgScores?.find((s: any) => s.sdgId === sdgId);
    if (!sdgData) {
      return res.status(404).json({ error: `No score data for SDG ${sdgId}.` });
    }

    const prevSdgData = prevScorecard?.sdgScores?.find((s: any) => s.sdgId === sdgId) ?? null;

    // Sector weight: share of KPIs in this SDG out of total sector weight
    const sectorWeightsMap = (SECTOR_WEIGHTS[company.sector as SectorType] || SECTOR_WEIGHTS.other) as Record<string, number>;
    const totalSectorWeight = Object.values(sectorWeightsMap).reduce((a, b) => a + b, 0);

    const sdgKPIs          = KPI_LIST.filter(k => k.sdgs.includes(sdgId));
    const sdgKpiWeightSum  = sdgKPIs.reduce((a, k) => a + (sectorWeightsMap[k.id] || 0), 0);
    const sectorWeight     = totalSectorWeight > 0 ? Math.round((sdgKpiWeightSum / totalSectorWeight) * 100) / 100 : null;

    const kpis = sdgKPIs.map(kpiDef => {
      const rawValue  = submissionData[kpiDef.id] ?? null;
      const threshold = KPI_THRESHOLDS[kpiDef.id] ?? null;
      const inverted  = INVERTED_KPIS.has(kpiDef.id);
      const unit      = kpiDef.unit === 'Percentage' ? '%' : '';

      let kpiScore: number | null     = null;
      let classification              = 'N/A' as 'High' | 'Medium' | 'Low' | 'N/A';

      if (rawValue !== null) {
        if (threshold) {
          if (inverted) {
            kpiScore = rawValue <= threshold.high ? 3 : rawValue <= threshold.low ? 2 : 1;
          } else {
            kpiScore = rawValue >= threshold.high ? 3 : rawValue >= threshold.low ? 2 : 1;
          }
        } else {
          kpiScore = 2;
        }
        classification = kpiScore === 3 ? 'High' : kpiScore === 2 ? 'Medium' : 'Low';
      }

      return {
        kpiId:         kpiDef.id,
        label:         kpiDef.name,
        description:   kpiDef.description,
        rawValue,
        unit,
        thresholds:    threshold ? {
          low:      0,
          medium:   threshold.low,
          high:     threshold.high,
          inverted,
        } : null,
        classification,
        kpiScore,
        isReported: rawValue !== null,
      };
    });

    const reportedCount    = kpis.filter(k => k.isReported).length;
    const submissionPeriod = latestSub?.scoredAt || latestSub?.submittedAt
      ? formatSubmissionPeriod(latestSub.scoredAt || latestSub.submittedAt)
      : 'No submission';

    return res.json({
      company: {
        id:      companyId,
        name:    company.name,
        sector:  company.sector,
        mandate: company.mandate,
      },
      sdg: {
        id:               sdgId,
        score:            sdgData.score,
        classification:   sdgData.classification,
        sectorAvg:        sdgData.sectorAvg,
        previousScore:    prevSdgData?.score ?? null,
        delta:            prevSdgData != null
          ? Math.round((sdgData.score - prevSdgData.score) * 100) / 100
          : null,
        sectorWeight,
        submissionPeriod,
      },
      kpis,
      reportedCount,
      totalCount: sdgKPIs.length,
    });
  } catch (err) {
    console.error('GET /pm/drilldown error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/pm/drilldown/:companyId/:sdgId/insight
router.post('/drilldown/:companyId/:sdgId/insight', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const sdgId         = parseInt(req.params['sdgId'] as string);
    const { drilldownData } = req.body;
    if (!drilldownData) return res.status(400).json({ error: 'drilldownData is required.' });

    const sdgMeta       = SDG_LIST.find(s => s.id === sdgId);
    const { company, sdg, kpis, reportedCount, totalCount } = drilldownData;

    const reported   = kpis.filter((k: any) => k.isReported);
    const unreported = kpis.filter((k: any) => !k.isReported).map((k: any) => k.label);

    const kpiLines = reported
      .map((k: any) => `  • ${k.label}: ${k.rawValue}${k.unit} — ${k.classification}`)
      .join('\n');

    const prompt =
      `You are an investment analyst at Sanlam Investments (South Africa), reviewing impact data.\n\n` +
      `Company: ${company.name}\n` +
      `Sector: ${company.sector.replace(/_/g, ' ')}\n` +
      `Mandate: ${company.mandate}\n` +
      `SDG ${sdgId} — ${sdgMeta?.name ?? ''}\n` +
      `Score: ${sdg.score.toFixed(2)}/3.00 (${sdg.classification} Impact)\n` +
      `Sector average: ${sdg.sectorAvg?.toFixed(2)} — ` +
      `${sdg.score >= sdg.sectorAvg ? 'above' : 'below'} average\n` +
      (sdg.delta !== null ? `vs last period: ${sdg.delta >= 0 ? '+' : ''}${sdg.delta.toFixed(2)}\n` : '') +
      `KPIs (${reportedCount}/${totalCount} reported):\n${kpiLines}\n` +
      (unreported.length ? `Not yet reported: ${unreported.join(', ')}\n` : '') +
      `\nWrite a 3–4 sentence investment analyst paragraph specific to SDG ${sdgId} for this company. ` +
      `Reference specific numbers. State what drives the score, how it compares to sector, and one concrete improvement action. ` +
      `Be direct and analytical. No bullet points.`;

    const response = await claude.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 280,
      messages:   [{ role: 'user', content: prompt }],
    });

    return res.json({ insight: (response.content[0] as any).text });
  } catch (err) {
    console.error('POST /pm/drilldown/insight error:', err);
    return res.status(500).json({ error: 'Failed to generate insight.' });
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok', route: 'pm' }));

export default router;
