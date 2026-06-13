import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebase.service';

export interface AuthRequest extends Request {
  user?: {
    uid:       string;
    email:     string;
    role:      string;
    companyId: string | null;
  };
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid:       decoded.uid,
      email:     decoded.email || '',
      role:      (decoded['role']      as string) || 'sme',
      companyId: (decoded['companyId'] as string) || null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
