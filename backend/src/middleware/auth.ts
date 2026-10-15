import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getOne } from '../database/db';
import { ENV } from '../config/env';
import { IUser } from '../types/shared/user.types';

export const JWT_SECRET = ENV.JWT_SECRET || 'neighshop_classifieds_super_secret_jwt_key_2026_vansh';

export interface DecodedToken {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await getOne<IUser>(
      'SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token: User account no longer exists.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      return;
    }

    if (user.status === 'deactivated') {
      res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(403).json({ success: false, message: 'Invalid or expired authorization token.', error: err.message });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await getOne<IUser>(
      'SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    req.user = (user && user.status === 'active') ? user : null;
  } catch {
    req.user = null;
  }
  next();
}
