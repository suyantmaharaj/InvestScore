import { Router, Response } from 'express';
import { db } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { writeAuditLog } from '../services/audit.service';

const router = Router();

const VALID_SECTORS = [
  'financial_services', 'manufacturing', 'ict', 'housing',
  'infrastructure', 'retail', 'logistics', 'other',
];

const VALID_MANDATES = ['Growth', 'Empowerment', 'Development'];

// GET /api/company-management/pm-users — MUST be before /:companyId patterns
router.get('/pm-users', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('users').where('role', '==', 'pm').get();
    return res.json({
      pmUsers: snap.docs.map(d => ({
        uid:   d.id,
        email: d.data().email,
        name:  d.data().displayName || d.data().email,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/company-management — list all companies
router.get('/', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('companies').orderBy('name').get();
    return res.json({
      companies: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('GET /company-management error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/company-management — create a new company
router.post('/', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, sector, industry, location, mandate, bbbeeLevel,
      description, website, spokespersonName, spokespersonTitle,
      spokespersonEmail, assignedPmUid, assignedPmEmail,
      targetIrr, active,
    } = req.body;

    if (!name?.trim())                     return res.status(400).json({ error: 'Company name is required.' });
    if (!VALID_SECTORS.includes(sector))   return res.status(400).json({ error: 'Invalid sector.' });
    if (!VALID_MANDATES.includes(mandate)) return res.status(400).json({ error: 'Invalid mandate.' });

    const company = {
      name:              name.trim(),
      sector,
      industry:          industry?.trim()          || '',
      location:          location?.trim()           || '',
      mandate,
      bbbeeLevel:        bbbeeLevel ? parseInt(bbbeeLevel) : null,
      description:       description?.trim()        || '',
      website:           website?.trim()            || '',
      spokespersonName:  spokespersonName?.trim()   || '',
      spokespersonTitle: spokespersonTitle?.trim()  || '',
      spokespersonEmail: spokespersonEmail?.trim()  || '',
      assignedPmUid:     assignedPmUid              || null,
      assignedPmEmail:   assignedPmEmail            || null,
      targetIrr:         targetIrr ? parseFloat(targetIrr) : null,
      active:            active !== false,
      status:            'active',
      bbbeeVerificationStatus: null,
      createdAt:         new Date().toISOString(),
      createdBy:         req.user!.email,
      updatedAt:         new Date().toISOString(),
    };

    const ref = await db.collection('companies').add(company);

    await writeAuditLog({
      action:      'company_profile_updated',
      actor:       req.user!.email,
      actorRole:   'admin',
      companyId:   ref.id,
      companyName: name.trim(),
      detail:      `Created company: ${name.trim()} (${mandate} mandate, ${sector})`,
      metadata:    { mandate, sector, assignedPmEmail },
    });

    return res.json({ company: { id: ref.id, ...company } });
  } catch (err) {
    console.error('POST /company-management error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/company-management/:companyId — update a company
router.put('/:companyId', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;
    const snap = await db.collection('companies').doc(companyId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Company not found.' });

    const {
      name, sector, industry, location, mandate, bbbeeLevel,
      description, website, spokespersonName, spokespersonTitle,
      spokespersonEmail, assignedPmUid, assignedPmEmail,
      targetIrr, active,
    } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (name?.trim())                     updates.name              = name.trim();
    if (VALID_SECTORS.includes(sector))   updates.sector            = sector;
    if (VALID_MANDATES.includes(mandate)) updates.mandate           = mandate;
    if (industry !== undefined)           updates.industry          = industry?.trim()         || '';
    if (location  !== undefined)          updates.location          = location?.trim()          || '';
    if (bbbeeLevel !== undefined)         updates.bbbeeLevel        = bbbeeLevel ? parseInt(bbbeeLevel) : null;
    if (description !== undefined)        updates.description       = description?.trim()       || '';
    if (website !== undefined)            updates.website           = website?.trim()           || '';
    if (spokespersonName !== undefined)   updates.spokespersonName  = spokespersonName?.trim()  || '';
    if (spokespersonTitle !== undefined)  updates.spokespersonTitle = spokespersonTitle?.trim() || '';
    if (spokespersonEmail !== undefined)  updates.spokespersonEmail = spokespersonEmail?.trim() || '';
    if (assignedPmUid !== undefined)      updates.assignedPmUid     = assignedPmUid            || null;
    if (assignedPmEmail !== undefined)    updates.assignedPmEmail   = assignedPmEmail           || null;
    if (targetIrr !== undefined)          updates.targetIrr         = targetIrr ? parseFloat(targetIrr) : null;
    if (active !== undefined)             updates.active            = active;

    await snap.ref.update(updates);

    await writeAuditLog({
      action:      'company_profile_updated',
      actor:       req.user!.email,
      actorRole:   'admin',
      companyId,
      companyName: updates.name || (snap.data() as any).name,
      detail:      `Updated company: ${updates.name || (snap.data() as any).name}`,
      metadata:    updates,
    });

    return res.json({ success: true, company: { id: companyId, ...snap.data(), ...updates } });
  } catch (err) {
    console.error('PUT /company-management error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/company-management/:companyId/deactivate — toggle active state
router.patch('/:companyId/deactivate', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;
    const snap = await db.collection('companies').doc(companyId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Company not found.' });

    const currently = (snap.data() as any).active !== false;
    await snap.ref.update({ active: !currently, updatedAt: new Date().toISOString() });

    await writeAuditLog({
      action:      'company_profile_updated',
      actor:       req.user!.email,
      actorRole:   'admin',
      companyId,
      companyName: (snap.data() as any).name,
      detail:      `Company ${currently ? 'deactivated' : 'reactivated'}: ${(snap.data() as any).name}`,
    });

    return res.json({ success: true, active: !currently });
  } catch (err) {
    console.error('PATCH /company-management/deactivate error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
