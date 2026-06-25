import { Router, Response } from 'express';
import { db, adminStorage } from '../services/firebase.service';
import { verifyToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { writeAuditLog } from '../services/audit.service';
import { createNotification } from './notifications.routes';

const router = Router();

const MAX_FILE_BYTES  = 10 * 1024 * 1024;  // 10 MB
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;  // 50 MB per company

router.get('/health', (_, res) => res.json({ status: 'ok', route: 'documents' }));

// ── DOCUMENT VAULT ────────────────────────────────────────────────────────────

// GET /api/documents/:companyId — list general documents
router.get('/:companyId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;

    if (req.user!.role === 'sme' && req.user!.companyId !== companyId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const snap = await db.collection('companyDocuments')
      .where('companyId', '==', companyId)
      .get();

    const documents = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((d: any) => d.type === 'general')
      .sort((a: any, b: any) => b.uploadedAt.localeCompare(a.uploadedAt));

    return res.json({ documents });
  } catch (err) {
    console.error('GET /documents error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/documents/:companyId — record a document after client-side upload
router.post('/:companyId', verifyToken, requireRole('sme', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;

    if (req.user!.role === 'sme' && req.user!.companyId !== companyId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { filename, originalName, fileSize, fileType, storagePath, downloadUrl, description } = req.body;

    if (!filename || !storagePath || !downloadUrl) {
      return res.status(400).json({ error: 'filename, storagePath and downloadUrl are required.' });
    }

    if (fileSize > MAX_FILE_BYTES) {
      return res.status(400).json({ error: 'File exceeds 10MB limit.' });
    }

    // Check total storage used by this company
    const existing = await db.collection('companyDocuments')
      .where('companyId', '==', companyId)
      .get();

    const totalUsed = existing.docs.reduce((sum, d) => sum + (d.data().fileSize || 0), 0);
    if (totalUsed + fileSize > MAX_TOTAL_BYTES) {
      return res.status(400).json({ error: 'Company storage limit (50MB) exceeded.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    const companyName = companySnap.exists ? companySnap.data()!.name : companyId;

    const docEntry = {
      companyId,
      companyName,
      type:         'general',
      filename,
      originalName,
      fileSize,
      fileType,
      storagePath,
      downloadUrl,
      description:  description?.trim() || '',
      uploadedBy:   req.user!.email,
      uploadedAt:   new Date().toISOString(),
    };

    const ref = await db.collection('companyDocuments').add(docEntry);

    await writeAuditLog({
      action:     'company_profile_updated',
      actor:      req.user!.email,
      actorRole:  req.user!.role,
      companyId,
      companyName,
      detail:     `Document uploaded: ${originalName}`,
      metadata:   { filename, fileSize, fileType },
    });

    return res.json({ document: { id: ref.id, ...docEntry } });
  } catch (err) {
    console.error('POST /documents error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/documents/:companyId/:docId
router.delete('/:companyId/:docId', verifyToken, requireRole('sme', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;
    const docId     = req.params['docId'] as string;

    if (req.user!.role === 'sme' && req.user!.companyId !== companyId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const snap = await db.collection('companyDocuments').doc(docId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Document not found.' });

    try {
      const file = adminStorage.bucket().file(snap.data()!.storagePath);
      await file.delete();
    } catch {
      // Storage file may already be gone — continue
    }

    await db.collection('companyDocuments').doc(docId).delete();
    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /documents error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── B-BBEE CERTIFICATES ───────────────────────────────────────────────────────

// GET /api/documents/bbbee/pending — list all pending verifications (admin only)
router.get('/bbbee/pending', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const snap = await db.collection('bbbeeVerifications')
      .where('status', '==', 'pending')
      .get();
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.submittedAt || b.uploadedAt || '').localeCompare(a.submittedAt || a.uploadedAt || ''));
    return res.json({ verifications: items });
  } catch (err) {
    console.error('GET /bbbee/pending error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/documents/bbbee/:verificationId/review — Admin approves or rejects
// Must be defined BEFORE /:companyId/bbbee to avoid route ambiguity
router.post('/bbbee/:verificationId/review', verifyToken, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const verificationId = req.params['verificationId'] as string;
    const { decision, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be "approve" or "reject".' });
    }

    if (decision === 'reject' && !rejectionReason?.trim()) {
      return res.status(400).json({ error: 'A rejection reason is required.' });
    }

    const snap = await db.collection('bbbeeVerifications').doc(verificationId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Verification not found.' });

    const verif = snap.data()!;

    await snap.ref.update({
      status:          decision === 'approve' ? 'approved' : 'rejected',
      reviewedBy:      req.user!.email,
      reviewedAt:      new Date().toISOString(),
      rejectionReason: decision === 'reject' ? rejectionReason.trim() : null,
    });

    if (decision === 'approve') {
      await db.collection('companies').doc(verif.companyId).update({
        bbbeeLevel:              verif.claimedLevel,
        bbbeeVerificationStatus: 'verified',
        bbbeeVerifiedAt:         new Date().toISOString(),
        bbbeeVerifiedBy:         req.user!.email,
      });
    } else {
      await db.collection('companies').doc(verif.companyId).update({
        bbbeeVerificationStatus: 'rejected',
        bbbeeRejectionReason:    rejectionReason.trim(),
      });
    }

    await createNotification({
      type:        decision === 'approve' ? 'classification_change' : 'risk_alert',
      title:       decision === 'approve'
        ? `B-BBEE Level ${verif.claimedLevel} certificate verified`
        : 'B-BBEE certificate rejected — action required',
      body:        decision === 'approve'
        ? `Your B-BBEE Level ${verif.claimedLevel} certificate has been verified. Your scorecard now reflects your verified level.`
        : `Your B-BBEE certificate submission was not accepted. Reason: ${rejectionReason}. Please upload a valid certificate.`,
      companyId:   verif.companyId,
      companyName: verif.companyName,
      severity:    decision === 'approve' ? 'info' : 'critical',
      forRole:     'all',
      metadata:    { verificationId, decision, claimedLevel: verif.claimedLevel },
    });

    await writeAuditLog({
      action:      decision === 'approve' ? 'user_approved' : 'user_rejected',
      actor:       req.user!.email,
      actorRole:   'admin',
      companyId:   verif.companyId,
      companyName: verif.companyName,
      detail:      `B-BBEE Level ${verif.claimedLevel} certificate ${decision}d`,
      metadata:    { verificationId, decision, rejectionReason: rejectionReason || null },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('POST /bbbee/review error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/documents/:companyId/bbbee — list B-BBEE verifications for a company
router.get('/:companyId/bbbee', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;

    if (req.user!.role === 'sme' && req.user!.companyId !== companyId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const snap = await db.collection('bbbeeVerifications')
      .where('companyId', '==', companyId)
      .get();

    const verifications = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => b.uploadedAt.localeCompare(a.uploadedAt))
      .slice(0, 5);

    return res.json({ verifications });
  } catch (err) {
    console.error('GET /bbbee error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/documents/:companyId/bbbee — submit B-BBEE certificate for verification
router.post('/:companyId/bbbee', verifyToken, requireRole('sme', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.params['companyId'] as string;

    if (req.user!.role === 'sme' && req.user!.companyId !== companyId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { filename, originalName, fileSize, fileType, storagePath, downloadUrl, claimedLevel } = req.body;

    if (!filename || !storagePath || !downloadUrl || !claimedLevel) {
      return res.status(400).json({ error: 'filename, storagePath, downloadUrl and claimedLevel are required.' });
    }

    const level = parseInt(claimedLevel);
    if (level < 1 || level > 8) {
      return res.status(400).json({ error: 'B-BBEE level must be between 1 and 8.' });
    }

    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) return res.status(404).json({ error: 'Company not found.' });
    const companyName = companySnap.data()!.name;

    // Supersede any previous pending submissions (single-field query, no composite index)
    const prevSnap = await db.collection('bbbeeVerifications')
      .where('companyId', '==', companyId)
      .get();

    const pendingDocs = prevSnap.docs.filter(d => d.data().status === 'pending');
    await Promise.all(pendingDocs.map(d => d.ref.update({ status: 'superseded' })));

    const entry = {
      companyId,
      companyName,
      filename,
      originalName,
      fileSize,
      fileType,
      storagePath,
      downloadUrl,
      claimedLevel:    level,
      status:          'pending',
      uploadedBy:      req.user!.email,
      uploadedAt:      new Date().toISOString(),
      reviewedBy:      null,
      reviewedAt:      null,
      rejectionReason: null,
    };

    const ref = await db.collection('bbbeeVerifications').add(entry);

    await db.collection('companies').doc(companyId).update({
      bbbeeVerificationStatus: 'pending',
      bbbeeVerificationId:     ref.id,
      bbbeeClaimedLevel:       level,
    });

    await createNotification({
      type:        'submission',
      title:       'B-BBEE certificate submitted for verification',
      body:        `${companyName} has uploaded a B-BBEE Level ${level} certificate for verification.`,
      companyId,
      companyName,
      severity:    'info',
      forRole:     'admin',
      metadata:    { verificationId: ref.id, claimedLevel: level },
    });

    await writeAuditLog({
      action:     'company_profile_updated',
      actor:      req.user!.email,
      actorRole:  req.user!.role,
      companyId,
      companyName,
      detail:     `B-BBEE Level ${level} certificate submitted for verification`,
      metadata:   { verificationId: ref.id, claimedLevel: level },
    });

    return res.json({ verification: { id: ref.id, ...entry } });
  } catch (err) {
    console.error('POST /bbbee error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
