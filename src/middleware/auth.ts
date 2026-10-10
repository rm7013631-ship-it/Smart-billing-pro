import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  businessId?: number;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // Handle demo / local dev quick-access session
  if (token.startsWith('demo-token-')) {
    const demoUid = token.replace('demo-token-', '') || 'demo-owner-1';
    const email = `${demoUid}@smartbillingpro.local`;
    const displayName = demoUid.replace('-', ' ').toUpperCase();
    try {
      const dbUser = await getOrCreateUser(demoUid, email, displayName);
      req.user = {
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.displayName || displayName,
      };
      return next();
    } catch (err) {
      console.error('Error with demo user db sync:', err);
      return res.status(500).json({ error: 'Authentication setup error' });
    }
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@user.local`,
      decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User')
    );
    req.user = {
      uid: dbUser.uid,
      email: dbUser.email,
      displayName: dbUser.displayName || 'User',
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
