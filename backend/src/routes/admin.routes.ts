import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, adminAuth } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { createNotification } from './notifications.routes';
import { writeAuditLog } from '../services/audit.service';

const router = Router();

router.use(verifyToken, requireRole('admin'));

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [usersSnap, companiesSnap, submissionsSnap, pendingSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('companies').get(),
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
    const allCompanies = companiesSnap.docs.filter(d => d.data().active !== false);
    const companiesWithoutUsers = allCompanies.filter(d => !linkedCompanyIds.has(d.id)).length;

    return res.json({
      totalUsers:           users.length,
      smeCount,
      pmCount,
      adminCount,
      activeCompanies:      allCompanies.length,
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

    const deletedSnap = await db.collection('users').doc(uid).get();
    const deletedEmail = deletedSnap.exists ? deletedSnap.data()!.email : uid;

    await adminAuth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();

    await writeAuditLog({
      action:    'user_deleted',
      actor:     req.user!.email,
      actorRole: 'admin',
      detail:    `Admin deleted user ${deletedEmail}`,
      metadata:  { uid, deletedEmail },
    });

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

    const claims: Record<string, any> = { role };
    if (role === 'sme' && companyId) claims.companyId = companyId;
    await adminAuth.setCustomUserClaims(fbUser.uid, claims);

    await db.collection('users').doc(fbUser.uid).set({
      uid:       fbUser.uid,
      email,
      name,
      role,
      companyId: companyId || null,
      createdAt: new Date().toISOString(),
    });

    await writeAuditLog({
      action:    'user_created',
      actor:     req.user!.email,
      actorRole: 'admin',
      detail:    `Admin created ${role} user ${email}`,
      metadata:  { uid: fbUser.uid, email, role, companyId: companyId || null },
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
      db.collection('companies').get(),
      db.collection('users').where('role', '==', 'sme').get(),
    ]);

    const linkedCompanyIds = new Set(
      usersSnap.docs.map(d => d.data().companyId).filter(Boolean)
    );

    const orphans = companiesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((c: any) => c.active !== false && !linkedCompanyIds.has(c.id))
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
      .map(d => {
        const { passwordHash, password, ...safe } = d.data() as any;
        return { id: d.id, ...safe };
      })
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

    // Generate a secure temporary password — admin shares this with the user
    const temporaryPassword = crypto.randomBytes(12).toString('base64url').slice(0, 16);

    const fbUser = await adminAuth.createUser({
      email:         reg.email,
      password:      temporaryPassword,
      displayName:   reg.name,
      emailVerified: true,
    });

    const claims: Record<string, any> = { role: 'sme' };
    if (companyId) claims.companyId = companyId;
    await adminAuth.setCustomUserClaims(fbUser.uid, claims);

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

    // Clear the stored hash and mark approved
    await snap.ref.update({
      status:       'approved',
      approvedAt:   new Date().toISOString(),
      passwordHash: null,
    });

    await writeAuditLog({
      action:    'registration_approved',
      actor:     req.user!.email,
      actorRole: 'admin',
      companyId: companyId || undefined,
      detail:    `Registration approved for ${reg.email} (${reg.companyName || reg.name})`,
      metadata:  { registrationId: req.params.id, email: reg.email, companyId },
    });

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

    return res.json({ success: true, uid: fbUser.uid, temporaryPassword });
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
    const rejSnap = await db.collection('pendingRegistrations').doc(req.params.id as string).get();
    const rejEmail = rejSnap.exists ? rejSnap.data()!.email : req.params.id;

    await db.collection('pendingRegistrations').doc(req.params.id as string).update({
      status:       'rejected',
      rejectedAt:   new Date().toISOString(),
      passwordHash: null,
    });

    await writeAuditLog({
      action:    'registration_rejected',
      actor:     req.user!.email,
      actorRole: 'admin',
      detail:    `Registration rejected for ${rejEmail}`,
      metadata:  { registrationId: req.params.id, email: rejEmail },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /admin/registrations/reject error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/admin/registrations/:id ──────────────────────────────────────
router.delete('/registrations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('pendingRegistrations').doc(req.params.id as string).get();
    if (!snap.exists) return res.status(404).json({ error: 'Registration not found.' });
    const reg = snap.data()!;
    if (reg.status === 'pending') {
      return res.status(400).json({ error: 'Cannot delete a pending registration. Reject it first.' });
    }
    await snap.ref.delete();
    await writeAuditLog({
      action:    'registration_rejected',
      actor:     req.user!.email,
      actorRole: 'admin',
      detail:    `Registration record removed for ${reg.email} (was ${reg.status})`,
      metadata:  { registrationId: req.params.id, email: reg.email, previousStatus: reg.status },
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/registrations error:', err);
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

    await writeAuditLog({
      action:    'ai_context_updated',
      actor:     req.user!.email,
      actorRole: 'admin',
      detail:    'AI coaching context updated',
      metadata:  { rulesCount: (rules || []).length, sectorsUpdated: Object.keys(sectorNotes || {}).length },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /admin/ai-context error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/admin/audit-log ──────────────────────────────────────────────────
router.get('/audit-log', async (req: AuthRequest, res: Response) => {
  try {
    const { limit: lim = '50', before, action, actor } = req.query;
    const limitN = Math.min(parseInt(lim as string) || 50, 200);

    if (action || actor) {
      // Filtered: single-field where only, sort in JS (no composite index)
      let query = db.collection('auditLog') as any;
      if (action) query = query.where('action', '==', action as string);
      if (actor)  query = query.where('actor',  '==', actor  as string);

      const snap    = await query.get();
      let entries   = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));

      if (before) {
        const idx = entries.findIndex((e: any) => e.timestamp <= (before as string));
        entries   = idx >= 0 ? entries.slice(idx) : [];
      }

      const page           = entries.slice(0, limitN);
      const lastTimestamp  = page.length > 0 ? (page[page.length - 1] as any).timestamp : null;
      return res.json({ entries: page, lastTimestamp, hasMore: entries.length > limitN });
    }

    // No filter: orderBy single field - no composite index needed
    let q: any = db.collection('auditLog').orderBy('timestamp', 'desc');
    if (before) q = q.startAfter(before as string);

    const snap     = await q.limit(limitN).get();
    const entries  = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const lastTimestamp = entries.length > 0 ? (entries[entries.length - 1] as any).timestamp : null;

    return res.json({ entries, lastTimestamp, hasMore: entries.length === limitN });
  } catch (err) {
    console.error('Audit log fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'admin' }));

export default router;
