import { Router, Response } from 'express';
import { db, adminAuth } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { createNotification } from './notifications.routes';

const router = Router();

router.use(verifyToken, requireRole('admin'));

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [usersSnap, companiesSnap, submissionsSnap, pendingSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('companies').where('status', '==', 'active').get(),
      db.collection('submissions').where('status', '==', 'scored').get(),
      db.collection('pendingRegistrations').where('status', '==', 'pending').get(),
    ]);

    const users      = usersSnap.docs.map(d => d.data());
    const smeCount   = users.filter(u => u.role === 'sme').length;
    const pmCount    = users.filter(u => u.role === 'pm').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    const linkedCompanyIds = new Set(
      users.filter(u => u.role === 'sme' && u.companyId).map(u => u.companyId)
    );
    const companiesWithoutUsers = companiesSnap.docs.filter(d => !linkedCompanyIds.has(d.id)).length;

    return res.json({
      totalUsers:           users.length,
      smeCount,
      pmCount,
      adminCount,
      activeCompanies:      companiesSnap.size,
      totalSubmissions:     submissionsSnap.size,
      pendingRegistrations: pendingSnap.size,
      companiesWithoutUsers,
    });
  } catch (err) {
    console.error('GET /admin/stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const snap  = await db.collection('users').get();
    const users = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return res.json({ users });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/admin/users/:uid ──────────────────────────────────────────────
router.delete('/users/:uid', async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.params.uid as string;

    if (uid === req.user!.uid) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await adminAuth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();

    return res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error('DELETE /admin/users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    }

    if (!['pm', 'sme', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const fbUser = await adminAuth.createUser({
      email,
      password,
      displayName:   name,
      emailVerified: true,
    });

    await adminAuth.setCustomUserClaims(fbUser.uid, { role });

    await db.collection('users').doc(fbUser.uid).set({
      uid:       fbUser.uid,
      email,
      name,
      role,
      companyId: companyId || null,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ success: true, uid: fbUser.uid });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('POST /admin/users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/admin/orphan-companies ──────────────────────────────────────────
router.get('/orphan-companies', async (req: AuthRequest, res: Response) => {
  try {
    const [companiesSnap, usersSnap] = await Promise.all([
      db.collection('companies').where('status', '==', 'active').get(),
      db.collection('users').where('role', '==', 'sme').get(),
    ]);

    const linkedCompanyIds = new Set(
      usersSnap.docs.map(d => d.data().companyId).filter(Boolean)
    );

    const orphans = companiesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((c: any) => !linkedCompanyIds.has(c.id))
      .sort((a: any, b: any) => (a.name ?? '').localeCompare(b.name ?? ''));

    return res.json({ companies: orphans });
  } catch (err) {
    console.error('GET /admin/orphan-companies error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/admin/registrations ──────────────────────────────────────────────
router.get('/registrations', async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('pendingRegistrations').get();
    const registrations = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.requestedAt ?? '').localeCompare(a.requestedAt ?? ''));
    return res.json({ registrations });
  } catch (err) {
    console.error('GET /admin/registrations error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/admin/registrations/:id/approve ─────────────────────────────────
router.post('/registrations/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('pendingRegistrations').doc(req.params.id as string).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    const reg        = snap.data()!;
    const { companyId } = req.body;

    const fbUser = await adminAuth.createUser({
      email:         reg.email,
      password:      reg.password,
      displayName:   reg.name,
      emailVerified: true,
    });

    await adminAuth.setCustomUserClaims(fbUser.uid, { role: 'sme' });

    await db.collection('users').doc(fbUser.uid).set({
      uid:       fbUser.uid,
      email:     reg.email,
      name:      reg.name,
      role:      'sme',
      companyId: companyId || null,
      createdAt: new Date().toISOString(),
    });

    if (companyId) {
      await db.collection('companies').doc(companyId as string).update({
        spokespersonEmail: reg.email,
        spokespersonName:  reg.name,
      });
    }

    await snap.ref.update({ status: 'approved', approvedAt: new Date().toISOString() });

    try {
      await createNotification({
        type:        'registration_approved',
        title:       'New company onboarded',
        body:        `${reg.companyName} has been approved and is now active on the platform. ${reg.name} can now log in and submit SDG data.`,
        companyName: reg.companyName,
        severity:    'info',
        forRole:     'pm',
        metadata:    { email: reg.email, industry: reg.industry },
      });
    } catch (notifErr) {
      console.error('Notification creation error (non-fatal):', notifErr);
    }

    return res.json({ success: true, uid: fbUser.uid });
  } catch (err: any) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('POST /admin/registrations/approve error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/admin/registrations/:id/reject ──────────────────────────────────
router.post('/registrations/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    await db.collection('pendingRegistrations').doc(req.params.id as string).update({
      status:     'rejected',
      rejectedAt: new Date().toISOString(),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /admin/registrations/reject error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/admin/ai-context ─────────────────────────────────────────────────
router.get('/ai-context', async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('aiContext').doc('global').get();
    if (!snap.exists) return res.json({ context: null });
    return res.json({ context: snap.data() });
  } catch (err) {
    console.error('GET /admin/ai-context error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/admin/ai-context ─────────────────────────────────────────────────
router.put('/ai-context', async (req: AuthRequest, res: Response) => {
  try {
    const { rules, sectorNotes, mandateContext } = req.body;

    await db.collection('aiContext').doc('global').update({
      rules:          rules          || [],
      sectorNotes:    sectorNotes    || {},
      mandateContext: mandateContext || {},
      updatedAt:      new Date().toISOString(),
      updatedBy:      req.user!.email,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /admin/ai-context error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'admin' }));

export default router;
