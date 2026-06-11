import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// GET /api/analytics/platform — Admin only
router.get('/platform', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const now    = new Date();
    const days30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const days90 = new Date(now.getTime() - 90 * 86400000).toISOString();

    // All queries in parallel — no orderBy with where (sort in JS)
    const [
      usersSnap,
      companiesSnap,
      submissionsSnap,
      scoredSnap,
      recentSubmissionsSnap,
      notificationsSnap,
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('companies').get(),
      db.collection('submissions').get(),
      db.collection('submissions').where('status', '==', 'scored').get(),
      db.collection('submissions').where('submittedAt', '>=', days30).get(),
      db.collection('notifications').where('createdAt', '>=', days30).get(),
    ]);

    const users     = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const companies = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const scored    = scoredSnap.docs.map(d => d.data());

    const smeUsers   = users.filter((u: any) => u.role === 'sme');
    const pmUsers    = users.filter((u: any) => u.role === 'pm');
    const adminUsers = users.filter((u: any) => u.role === 'admin');

    const scoredCompanyIds = new Set(scored.map((s: any) => s.companyId));
    const neverSubmitted   = companies.filter((c: any) => !scoredCompanyIds.has(c.id)).length;

    // Companies overdue — last scored submission > 90 days ago
    const latestByCompany: Record<string, string> = {};
    scored.forEach((s: any) => {
      if (!latestByCompany[s.companyId] || s.scoredAt > latestByCompany[s.companyId]) {
        latestByCompany[s.companyId] = s.scoredAt;
      }
    });
    const overdue90 = Object.values(latestByCompany).filter(d => d < days90).length;

    // Quarter funnel
    const quarterStart = new Date();
    quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1);
    quarterStart.setHours(0, 0, 0, 0);
    const quarterSnap = await db.collection('submissions')
      .where('submittedAt', '>=', quarterStart.toISOString())
      .get();
    const thisQuarterSubmissions = quarterSnap.size;
    const thisQuarterScored = quarterSnap.docs.filter(d => d.data().status === 'scored').length;

    // Average data completeness across all scored submissions
    const EXPECTED_FIELDS = 35;
    let totalReported  = 0;
    let totalPossible  = 0;
    scored.forEach((s: any) => {
      if (!s.data) return;
      totalReported += Object.values(s.data).filter(v => v !== null && v !== undefined).length;
      totalPossible += EXPECTED_FIELDS;
    });
    const avgDataCompleteness = totalPossible > 0
      ? Math.round((totalReported / totalPossible) * 100)
      : 0;

    // Recent submissions — sort in JS (no orderBy with where)
    const recentActivity = recentSubmissionsSnap.docs
      .map(d => ({
        type:      'submission',
        companyId: d.data().companyId as string,
        timestamp: d.data().submittedAt as string,
        detail:    `Submission ${d.data().status}`,
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 20);

    notificationsSnap.docs.slice(0, 10).forEach(d => {
      recentActivity.push({
        type:      d.data().type,
        companyId: d.data().companyId,
        timestamp: d.data().createdAt,
        detail:    d.data().title,
      });
    });
    recentActivity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Submissions by month — last 6 months
    const monthlyMap: Record<string, number> = {};
    scoredSnap.docs.forEach(d => {
      const month = (d.data().scoredAt as string)?.slice(0, 7);
      if (month) monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    const submissionsByMonth = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    return res.json({
      users: {
        total: users.length,
        sme:   smeUsers.length,
        pm:    pmUsers.length,
        admin: adminUsers.length,
      },
      companies: {
        total:         companies.length,
        neverSubmitted,
        overdue90,
        withScorecard: scoredCompanyIds.size,
      },
      submissions: {
        total:               submissionsSnap.size,
        scored:              scored.length,
        thisQuarter:         thisQuarterSubmissions,
        thisQuarterScored,
        avgDataCompleteness,
        byMonth:             submissionsByMonth,
      },
      notifications: {
        last30Days: notificationsSnap.size,
      },
      recentActivity: recentActivity.slice(0, 15),
    });

  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
