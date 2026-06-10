import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const availableLessons = [
  { id: 'sdg-1', title: 'No Poverty', sdgId: 1, category: 'sdg', difficulty: 'Beginner', duration: '4 min' },
  { id: 'sdg-4', title: 'Quality Education', sdgId: 4, category: 'sdg', difficulty: 'Beginner', duration: '4 min' },
  { id: 'sdg-5', title: 'Gender Equality', sdgId: 5, category: 'sdg', difficulty: 'Intermediate', duration: '5 min' },
  { id: 'sdg-7', title: 'Clean Energy', sdgId: 7, category: 'sdg', difficulty: 'Intermediate', duration: '5 min' },
  { id: 'sdg-8', title: 'Decent Work & Economic Growth', sdgId: 8, category: 'sdg', difficulty: 'Beginner', duration: '6 min' },
  { id: 'sdg-10', title: 'Reduced Inequalities (B-BBEE)', sdgId: 10, category: 'sdg', difficulty: 'Intermediate', duration: '7 min' },
  { id: 'sdg-13', title: 'Climate Action', sdgId: 13, category: 'sdg', difficulty: 'Intermediate', duration: '6 min' },
  { id: 'kpi-employment', title: 'Employment Data Reporting', category: 'kpi', difficulty: 'Beginner', duration: '5 min' },
  { id: 'kpi-environmental', title: 'Environmental Metrics', category: 'kpi', difficulty: 'Intermediate', duration: '6 min' },
  { id: 'kpi-bbbee', title: 'B-BBEE & Transformation', category: 'kpi', difficulty: 'Intermediate', duration: '8 min' },
  { id: 'kpi-community', title: 'Community & Supply Chain', category: 'kpi', difficulty: 'Beginner', duration: '4 min' },
];

router.post('/generate-path', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, goal } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const [companySnap, scorecardSnap] = await Promise.all([
      db.collection('companies').doc(companyId).get(),
      db.collection('scorecards')
        .where('companyId', '==', companyId)
        .orderBy('calculatedAt', 'desc')
        .limit(1)
        .get(),
    ]);

    if (!companySnap.exists) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const company = companySnap.data()!;
    const scorecard = scorecardSnap.empty ? null : scorecardSnap.docs[0].data();

    let scoreContext = 'No scorecard data available yet.';
    if (scorecard?.sdgScores?.length) {
      const lowSDGs = scorecard.sdgScores.filter((s: any) => s.classification === 'Low');
      const highSDGs = scorecard.sdgScores.filter((s: any) => s.classification === 'High');
      const sdgLines = scorecard.sdgScores
        .map((s: any) => `SDG ${s.sdgId}: ${Number(s.score).toFixed(1)} (${s.classification})`)
        .join(', ');
      scoreContext = `Overall: ${Number(scorecard.overallScore).toFixed(1)}/3.0 (${scorecard.classification} Impact)
Low Impact goals: ${lowSDGs.map((s: any) => `SDG ${s.sdgId}`).join(', ') || 'None'}
High Impact goals: ${highSDGs.map((s: any) => `SDG ${s.sdgId}`).join(', ') || 'None'}
All SDG scores: ${sdgLines}`;
    }

    const prompt = `You are an SDG learning advisor for South African SMEs on the INvestScore platform by Sanlam Investments.

COMPANY: ${company.name}
SECTOR: ${(company.sector || '').replace(/_/g, ' ')}
LOCATION: ${company.location || 'Not provided'}

CURRENT SDG PERFORMANCE:
${scoreContext}

USER GOAL: ${goal || 'Improve my overall SDG score and understand sustainability reporting'}

AVAILABLE LESSONS:
${availableLessons.map(l => `- ${l.id}: "${l.title}" (${l.difficulty}, ${l.duration})`).join('\n')}

Create a personalised learning path for this company. You MUST respond with ONLY valid JSON - no preamble, no explanation, no markdown fences. The JSON must match this exact structure:

{
  "goalStatement": "One sentence describing what this path will achieve",
  "estimatedTime": "Total time e.g. '28 minutes'",
  "expectedImprovement": "What score improvement is realistic e.g. 'Your SDG 10 score could move from Low to Medium Impact'",
  "milestones": [
    { "title": "Milestone name", "description": "What the SME will be able to do", "lessonsRequired": ["lesson-id-1", "lesson-id-2"] }
  ],
  "lessons": [
    {
      "lessonId": "lesson-id",
      "title": "Lesson title",
      "order": 1,
      "reason": "One sentence: why this lesson is prioritised for this specific company",
      "priority": "high|medium|low"
    }
  ],
  "personalNote": "A 2-sentence personalised message to the SME about their journey, referencing their company name and sector"
}

Rules:
- Include 4-7 lessons maximum. Quality over quantity.
- Prioritise lessons for their lowest-scoring SDGs first.
- The first lesson should always be achievable and motivating (Beginner difficulty if possible).
- Only use lesson IDs from the available lessons list above.
- The milestones array should have 2-3 milestones.
- Respond with ONLY the JSON object. Nothing else.`;

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const path = JSON.parse(clean);

    const pathDoc = {
      companyId,
      goal: goal || null,
      goalStatement: path.goalStatement,
      estimatedTime: path.estimatedTime,
      expectedImprovement: path.expectedImprovement,
      milestones: path.milestones,
      lessons: path.lessons,
      personalNote: path.personalNote,
      completedLessons: [],
      generatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    await db.collection('learningPaths').doc(companyId).set(pathDoc, { merge: false });

    return res.json({ path: pathDoc });
  } catch (err) {
    console.error('Generate learning path error:', err);
    return res.status(500).json({ error: 'Failed to generate learning path.' });
  }
});

router.get('/path/:companyId', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = String(req.params.companyId);
    const snap = await db.collection('learningPaths').doc(companyId).get();
    if (!snap.exists) return res.json({ path: null });
    return res.json({ path: snap.data() });
  } catch (err) {
    console.error('Load learning path error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/path/:companyId/complete-lesson', verifyToken, requireRole('sme'), async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required.' });

    const companyId = String(req.params.companyId);
    const snap = await db.collection('learningPaths').doc(companyId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Path not found.' });

    const current = snap.data()!;
    const completed = new Set(current.completedLessons || []);
    completed.add(lessonId);

    await snap.ref.update({
      completedLessons: [...completed],
      lastUpdated: new Date().toISOString(),
    });

    return res.json({ success: true, completedLessons: [...completed] });
  } catch (err) {
    console.error('Complete learning lesson error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
