import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/coach — SME AI Coach chat
router.post('/coach', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, messages, sdgFocus } = req.body;

    if (!companyId || !messages?.length) {
      return res.status(400).json({ error: 'companyId and messages are required.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company not found.' });
    }
    const company = companySnap.data()!;

    // Sort in JS to avoid composite index requirement
    const scorecardSnap = await db
      .collection('scorecards')
      .where('companyId', '==', companyId)
      .get();

    let scorecardContext = 'No scorecard data available yet.';
    if (!scorecardSnap.empty) {
      const sorted = scorecardSnap.docs
        .map(d => d.data())
        .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
      const sc = sorted[0];
      const sdgLines = sc.sdgScores
        .map((s: any) => `  SDG ${s.sdgId} (${s.sdgName}): ${s.score.toFixed(1)} — ${s.classification} (sector avg: ${s.sectorAvg.toFixed(1)})`)
        .join('\n');
      scorecardContext = `Overall Score: ${sc.overallScore.toFixed(1)} (${sc.classification} Impact)\nPeriod: ${sc.submissionPeriod}\n\nSDG Scores:\n${sdgLines}`;
    }

    const aiContextSnap = await db.collection('aiContext').doc('global').get();
    const aiContext   = aiContextSnap.exists ? aiContextSnap.data()! : {};
    const globalRules = (aiContext.rules || []).join('\n- ');
    const sectorNote  = aiContext.sectorNotes?.[company.sector] || '';

    const systemPrompt = `You are the INvestScore AI Coach — a knowledgeable and encouraging sustainability advisor for South African SMEs.

You work within Sanlam Investments' INvestScore platform. Your role is to help SME owners understand their SDG (Sustainable Development Goal) scores and take practical steps to improve them.

COMPANY CONTEXT:
Company: ${company.name}
Sector: ${company.sector.replace(/_/g, ' ')}
Location: ${company.location}
Industry: ${company.industry}

SCORECARD DATA:
${scorecardContext}

${sdgFocus ? `USER IS ASKING ABOUT: SDG ${sdgFocus} specifically. Start by acknowledging this focus.` : ''}

COACHING RULES (from Sanlam Investments):
- ${globalRules || 'Always provide practical, actionable advice.'}

SECTOR GUIDANCE:
${sectorNote || 'Provide relevant sector-specific advice.'}

CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. You are an interpreter of scores — you do not calculate, change, or override scores.
2. Always refer to the Sanlam proprietary methodology when explaining how scores work.
3. Speak in South African context: use Rands (ZAR), reference B-BBEE, Eskom, SETA, NQF, POPIA, and other South African frameworks where relevant.
4. Be encouraging and practical. Never condescending.
5. Always prioritise high-impact, low-cost improvements first.
6. Do not reveal or compare specific named peer companies.
7. When you recommend improving a metric, always explain WHY it matters for the specific SDG.
8. Keep responses concise and actionable — bullet points work well for action steps.
9. If asked about topics unrelated to SDGs, sustainability, or business improvement, politely redirect to your coaching role.
10. Never claim to have real-time data beyond what is in the scorecard provided above.

TONE: Warm, direct, South African. Like a trusted business advisor, not a corporate chatbot.`;

    const claudeMessages = messages.map((m: { role: string; content: string }) => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await claude.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   claudeMessages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    return res.json({ message: text });

  } catch (err) {
    console.error('AI coach error:', err);
    return res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// POST /api/ai/narrative — PM narrative generator (used in PM portal)
router.post('/narrative', verifyToken, requireRole('pm', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company not found.' });
    }
    const company = companySnap.data()!;

    // Sort in JS to avoid composite index requirement
    const scorecardSnap = await db
      .collection('scorecards')
      .where('companyId', '==', companyId)
      .get();

    if (scorecardSnap.empty) {
      return res.status(404).json({ error: 'No scorecard found for this company.' });
    }

    const sorted = scorecardSnap.docs
      .map(d => d.data())
      .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
    const sc = sorted[0];

    const highSDGs   = sc.sdgScores.filter((s: any) => s.classification === 'High').map((s: any) => `SDG ${s.sdgId}`).join(', ');
    const lowSDGs    = sc.sdgScores.filter((s: any) => s.classification === 'Low').map((s: any) => `SDG ${s.sdgId}`).join(', ');
    const sdgSummary = sc.sdgScores.map((s: any) => `SDG ${s.sdgId}: ${s.score.toFixed(1)} (${s.classification})`).join(', ');

    const prompt = `You are a sustainability investment analyst at Sanlam Investments.

Write a concise investment committee narrative for the following SME portfolio company.

COMPANY: ${company.name}
SECTOR: ${company.sector.replace(/_/g, ' ')}
LOCATION: ${company.location}
DESCRIPTION: ${company.description}

SDG SCORECARD (${sc.submissionPeriod}):
Overall Score: ${sc.overallScore.toFixed(1)} / 3.0 (${sc.classification} Impact)
${sdgSummary}

High performers: ${highSDGs || 'None'}
Needs attention: ${lowSDGs  || 'None'}

Write a 3-paragraph narrative covering:
1. Overall sustainability profile and what the score says about this company
2. Key strengths (high-scoring SDGs) and what drives them
3. Priority improvement areas and recommended next steps

Keep it professional, data-grounded, and investment-committee appropriate.
Write in third person. Do not use bullet points. Keep under 250 words.`;

    const response = await claude.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 600,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    return res.json({ narrative: text });

  } catch (err) {
    console.error('Narrative error:', err);
    return res.status(500).json({ error: 'AI service unavailable.' });
  }
});

// POST /api/ai/improvement-plan — SME improvement plan generator
router.post('/improvement-plan', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: 'companyId is required.' });

    const [companySnap, scorecardSnap, submissionSnap] = await Promise.all([
      db.collection('companies').doc(companyId).get(),
      db.collection('scorecards').where('companyId', '==', companyId).get(),
      db.collection('submissions')
        .where('companyId', '==', companyId)
        .where('status', '==', 'scored')
        .get(),
    ]);

    if (!companySnap.exists) return res.status(404).json({ error: 'Company not found.' });
    if (scorecardSnap.empty) return res.status(404).json({ error: 'No scorecard found.' });

    const company = companySnap.data()!;
    const scorecard = scorecardSnap.docs
      .map(d => d.data())
      .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt))[0];
    const submission = submissionSnap.empty
      ? null
      : submissionSnap.docs
          .map(d => d.data())
          .sort((a, b) => (b.scoredAt || b.submittedAt || '').localeCompare(a.scoredAt || a.submittedAt || ''))[0];

    const lowSDGs = scorecard.sdgScores
      .filter((s: any) => s.classification === 'Low' || s.score < 1.8)
      .sort((a: any, b: any) => a.score - b.score);

    if (lowSDGs.length === 0) {
      const plan = {
        actions: [],
        summary: 'Your portfolio has no Low Impact goals. Focus on maintaining your current performance and pushing Medium goals toward High.',
        generatedAt: new Date().toISOString(),
      };
      await db.collection('improvementPlans').doc(companyId).set({ ...plan, companyId });
      return res.json({ plan });
    }

    const submittedKPIs = submission?.data
      ? Object.entries(submission.data)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'No submission data';

    const sdgDetails = lowSDGs.map((s: any) =>
      `SDG ${s.sdgId} (${s.sdgName}): score ${Number(s.score).toFixed(1)}/3.0, sector avg ${Number(s.sectorAvg).toFixed(1)}`
    ).join('\n');

    const sector = (company.sector || '').replace(/_/g, ' ');
    const prompt = `You are an SDG improvement advisor for South African SMEs at Sanlam Investments.

COMPANY: ${company.name}
SECTOR: ${sector}
LOCATION: ${company.location || 'Not provided'}

LOW-SCORING SDG GOALS:
${sdgDetails}

LATEST SUBMITTED KPI VALUES:
${submittedKPIs}

Generate a practical improvement plan. Respond with ONLY valid JSON - no preamble, no markdown.

{
  "summary": "2 sentences summarising the company's improvement opportunity",
  "actions": [
    {
      "sdgId": 10,
      "sdgName": "Reduced Inequalities",
      "priority": "critical|high|medium",
      "effort": "low|medium|high",
      "timeframe": "e.g. '1 month' or 'Next quarter'",
      "action": "Specific, actionable step - one sentence",
      "why": "Why this action improves the SDG score - one sentence",
      "kpiImpact": "Which KPI(s) this action improves",
      "expectedGain": "e.g. 'Could move SDG 10 from Low to Medium Impact'"
    }
  ]
}

Rules:
- Generate 1-2 actions per low-scoring SDG
- Prioritise: critical = score below 1.4, high = 1.4-1.6, medium = 1.6-1.8
- Effort: low = can be done this week, medium = 1 month, high = 3+ months
- Actions must be specific to ${sector} sector companies in South Africa
- Reference B-BBEE, Eskom, SETA, SANAS, or other SA-specific frameworks where relevant
- Sort actions by priority (critical first)
- Respond with ONLY the JSON. Nothing else.`;

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const generatedAt = new Date().toISOString();
    const plan = { ...parsed, companyId, generatedAt };

    await db.collection('improvementPlans').doc(companyId).set(plan);

    return res.json({ plan });
  } catch (err) {
    console.error('Improvement plan error:', err);
    return res.status(500).json({ error: 'Failed to generate improvement plan.' });
  }
});

// GET /api/ai/improvement-plan/:companyId — cached SME improvement plan
router.get('/improvement-plan/:companyId', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const snap = await db.collection('improvementPlans').doc(companyId).get();
    if (!snap.exists) return res.json({ plan: null });

    const data = snap.data()!;
    const age = Date.now() - new Date(data.generatedAt).getTime();
    if (age > 86400000) return res.json({ plan: null });

    return res.json({ plan: data });
  } catch (err) {
    console.error('Load improvement plan error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'ai' }));

export default router;
