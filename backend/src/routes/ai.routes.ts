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

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'ai' }));

export default router;
