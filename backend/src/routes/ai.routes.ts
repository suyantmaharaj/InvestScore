import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const GEMINI_MODEL = 'gemini-2.5-flash';

// POST /api/ai/coach - Chase chat with full company context
router.post('/coach', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { messages, companyId, documentText } = req.body;

    if (!companyId || !messages?.length) {
      return res.status(400).json({ error: 'companyId and messages are required.' });
    }

    // Load all context in parallel - no orderBy (sort in JS)
    const [
      companySnap,
      scorecardDocs,
      submissionDocs,
      targetsSnap,
      aiContextSnap,
    ] = await Promise.all([
      db.collection('companies').doc(companyId).get(),
      db.collection('scorecards').where('companyId', '==', companyId).get(),
      db.collection('submissions')
        .where('companyId', '==', companyId)
        .where('status', '==', 'scored')
        .get(),
      db.collection('targets').doc(companyId).get(),
      db.collection('aiContext').doc('global').get(),
    ]);

    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const company   = companySnap.data()!;
    const aiContext = aiContextSnap.exists ? aiContextSnap.data() : null;

    // Sort scorecards in JS
    const sortedScorecards = scorecardDocs.docs
      .map(d => d.data())
      .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
    const scorecard    = sortedScorecards[0] || null;
    const scoreHistory = sortedScorecards.slice(0, 4).reverse(); // oldest→newest for trend

    // Sort submissions in JS
    const sortedSubmissions = submissionDocs.docs
      .map(d => d.data())
      .sort((a, b) => (b.scoredAt || '').localeCompare(a.scoredAt || ''));
    const submission = sortedSubmissions[0] || null;

    const targets = targetsSnap.exists ? (targetsSnap.data()!.targets || {}) : {};

    // Build SDG scores context
    let sdgContext = 'No scorecard data submitted yet.';
    if (scorecard) {
      const low    = scorecard.sdgScores.filter((s: any) => s.classification === 'Low');
      const medium = scorecard.sdgScores.filter((s: any) => s.classification === 'Medium');
      const high   = scorecard.sdgScores.filter((s: any) => s.classification === 'High');
      sdgContext = `Overall score: ${scorecard.overallScore.toFixed(1)}/3.0 (${scorecard.classification} Impact)

HIGH IMPACT goals: ${high.map((s: any) => `SDG ${s.sdgId} (${s.score.toFixed(1)})`).join(', ') || 'None yet'}
MEDIUM IMPACT goals: ${medium.map((s: any) => `SDG ${s.sdgId} (${s.score.toFixed(1)})`).join(', ') || 'None'}
LOW IMPACT goals (need attention): ${low.map((s: any) => `SDG ${s.sdgId} (${s.score.toFixed(1)}, sector avg ${s.sectorAvg.toFixed(1)})`).join(', ') || 'None'}`;
    }

    // Build KPI context from latest submission
    let kpiContext = 'No KPI data submitted yet.';
    if (submission?.data) {
      const d = submission.data;
      const lines = [
        d.total_employees    != null ? `Total employees: ${d.total_employees}` : null,
        d.youth_employees    != null ? `Youth employees: ${d.youth_employees}${d.total_employees ? ` (${Math.round((d.youth_employees/d.total_employees)*100)}%)` : ''}` : null,
        d.female_employees   != null ? `Female employees: ${d.female_employees}${d.total_employees ? ` (${Math.round((d.female_employees/d.total_employees)*100)}%)` : ''}` : null,
        d.bbbee_rating       != null ? `B-BBEE Level: ${d.bbbee_rating}` : null,
        d.black_ownership_pct!= null ? `Black ownership: ${d.black_ownership_pct}%` : null,
        d.scope2_co2e        != null ? `Scope 2 emissions: ${d.scope2_co2e} tCO2e` : null,
        d.renewable_energy_produced != null ? `Renewable energy: ${d.renewable_energy_produced} kWh` : null,
        d.total_annual_revenue != null ? `Annual revenue: R${Number(d.total_annual_revenue).toLocaleString('en-ZA')}` : null,
        d.procurement_black_owned_pct != null ? `Procurement to Black-owned: ${d.procurement_black_owned_pct}%` : null,
      ].filter(Boolean);
      kpiContext = lines.join('\n');
    }

    // Build targets context
    let targetsContext = 'No targets set by Portfolio Manager yet.';
    if (Object.keys(targets).length > 0) {
      targetsContext = 'PM-set targets: ' + Object.entries(targets)
        .map(([sdgId, t]: any) => `SDG ${sdgId} → ${t.classification || t} Impact`)
        .join(', ');
    }

    // Score trend
    const trendContext = scoreHistory.length > 1
      ? `Score history: ${scoreHistory.map((h: any) => `${h.submissionPeriod}: ${h.overallScore?.toFixed(1)} (${h.classification})`).join(' → ')}`
      : scoreHistory.length === 1
        ? `First submission: ${scoreHistory[0].overallScore?.toFixed(1)} (${scoreHistory[0].classification}). No trend data yet.`
        : 'No submission history yet.';

    const globalRules = aiContext?.rules?.join('\n') || 'Always provide practical, actionable advice.';
    const sectorNote  = aiContext?.sectorNotes?.[company.sector] || '';
    const mandateNote = aiContext?.mandateContext?.[company.mandate] || '';

    const docContext = documentText
      ? `\n\nUSER UPLOADED DOCUMENT:\n${String(documentText).slice(0, 8000)}\n\nUse this document to answer the user's question. If it contains KPI data relevant to their submission, highlight it.`
      : '';

    const systemPrompt = `You are Chase, the SDG coaching assistant for InvestScore - built by Sanlam Investments for the 104+ SMME Growth and Empowerment Solution.

You are talking to ${company.spokespersonName || 'the owner'} of ${company.name}, a ${(company.sector || '').replace(/_/g, ' ')} company based in ${company.location}.

COMPANY PROFILE:
- Name: ${company.name}
- Sector: ${(company.sector || '').replace(/_/g, ' ')}
- Industry: ${company.industry || 'Not provided'}
- Location: ${company.location}
- Mandate: ${company.mandate || 'Not assigned'} Mandate
- B-BBEE Level: ${company.bbbeeLevel || 'Not certified'}
- Description: ${company.description || 'Not provided'}

CURRENT SDG PERFORMANCE:
${sdgContext}

SUBMITTED KPI DATA (most recent):
${kpiContext}

PM TARGETS:
${targetsContext}

SCORE TREND:
${trendContext}

COACHING RULES:
${globalRules}

SECTOR CONTEXT:
${sectorNote || 'Provide relevant sector-specific advice.'}

MANDATE CONTEXT:
${mandateNote}
${docContext}

CHASE PERSONALITY AND STYLE:
- You are Chase - friendly, direct, and encouraging. Named after the Sanlam cheetah mascot.
- You know this company's data intimately. Reference specific numbers from their scorecard.
- Never give generic advice. Always tie recommendations to their actual scores and KPIs.
- Use South African context: Eskom, B-BBEE, SETA, SANAS, NQF, POPIA, rand amounts.
- Celebrate wins. If a score is High, acknowledge it before pivoting to improvements.
- Keep responses concise - 2–4 short paragraphs. Use bullet points for action lists.
- End responses with a specific question to keep the conversation moving.
- Never make up scores or data. If you don't know something, say so.
- Do not alter or question Sanlam's scoring methodology - it is fixed.`;

    const history = messages.slice(0, -1).map((m: any) => ({
      role:  m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
    const lastMsg = messages[messages.length - 1];

    const chat = ai.chats.create({
      model:  GEMINI_MODEL,
      config: { systemInstruction: systemPrompt, maxOutputTokens: 800 },
      history,
    });

    const response = await chat.sendMessage({ message: lastMsg.content });
    const text     = response.text ?? '';

    return res.json({ message: text });

  } catch (err) {
    console.error('Chase /coach error:', err);
    return res.status(500).json({ error: 'Chase is unavailable right now. Please try again.' });
  }
});

// POST /api/ai/extract-kpis - Chase reads a document and extracts KPI values
router.post('/extract-kpis', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { documentText, companyId } = req.body;
    if (!documentText) return res.status(400).json({ error: 'documentText is required.' });

    const prompt = `Extract SDG-relevant KPI values from this business document.

Look for these KPI IDs:
total_employees, youth_employees, female_employees, management_employees, contractor_employees,
scope1_co2e, scope2_co2e, electricity_consumption, renewable_energy_produced,
recycled_waste_pct, total_water_consumption,
bbbee_rating, black_ownership_pct, black_female_ownership_pct,
black_board_pct, procurement_black_owned_pct, procurement_women_owned_pct,
total_annual_revenue, csi_spend, local_suppliers, smes_in_supply_chain

DOCUMENT:
${String(documentText).slice(0, 10000)}

Respond ONLY with a JSON object. Keys are KPI IDs from the list. Values are numbers only. Only include KPIs you found with confidence. Example: {"total_employees": 71, "female_employees": 15}`;

    const response = await ai.models.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
      config:   { maxOutputTokens: 500 },
    });

    const text = response.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    let extracted: Record<string, number> = {};
    try { extracted = JSON.parse(clean); } catch {}

    return res.json({ extracted, count: Object.keys(extracted).length });
  } catch (err) {
    console.error('KPI extraction error:', err);
    return res.status(500).json({ error: 'Extraction failed.' });
  }
});

// POST /api/ai/narrative - PM narrative generator (used in PM portal)
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

    const toDisp = (raw: number) => Math.round(((raw - 1) / 2) * 100);
    const highSDGs   = sc.sdgScores.filter((s: any) => s.classification === 'High').map((s: any) => `SDG ${s.sdgId}`).join(', ');
    const lowSDGs    = sc.sdgScores.filter((s: any) => s.classification === 'Low').map((s: any) => `SDG ${s.sdgId}`).join(', ');
    const sdgSummary = sc.sdgScores.map((s: any) => `SDG ${s.sdgId}: ${toDisp(s.score)}/100 (${s.classification})`).join(', ');

    const prompt = `You are a sustainability investment analyst at Sanlam Investments.

Write a concise investment committee narrative for the following SME portfolio company.

COMPANY: ${company.name}
SECTOR: ${company.sector.replace(/_/g, ' ')}
LOCATION: ${company.location}
DESCRIPTION: ${company.description}

SDG SCORECARD (${sc.submissionPeriod}):
Overall Score: ${toDisp(sc.overallScore)}/100 (${sc.classification} Impact)
${sdgSummary}

High performers: ${highSDGs || 'None'}
Needs attention: ${lowSDGs  || 'None'}

Write a 3-paragraph narrative covering:
1. Overall sustainability profile and what the score says about this company
2. Key strengths (high-scoring SDGs) and what drives them
3. Priority improvement areas and recommended next steps

Keep it professional, data-grounded, and investment-committee appropriate.
Write in third person. Do not use bullet points. Keep under 250 words.`;

    const response = await ai.models.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
      config:   { maxOutputTokens: 600 },
    });

    const text = response.text ?? '';

    return res.json({ narrative: text });

  } catch (err) {
    console.error('Narrative error:', err);
    return res.status(500).json({ error: 'AI service unavailable.' });
  }
});

// POST /api/ai/improvement-plan - SME improvement plan generator
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

    const dispScore = (raw: number) => Math.round(((raw - 1) / 2) * 100);
    const sdgDetails = lowSDGs.map((s: any) =>
      `SDG ${s.sdgId} (${s.sdgName}): score ${dispScore(Number(s.score))}/100, sector avg ${dispScore(Number(s.sectorAvg))}/100`
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

    const response = await ai.models.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
      config:   { maxOutputTokens: 1000 },
    });

    const text = response.text ?? '';
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

// GET /api/ai/improvement-plan/:companyId - cached SME improvement plan
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
