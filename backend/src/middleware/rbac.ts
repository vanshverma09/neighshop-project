import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/shared/user.types';

export function requireRole(...allowedRoles: (UserRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Action requires one of the following roles: [${allowedRoles.join(', ')}]. Your role is: ${req.user.role}`
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireSeller = requireRole('seller', 'admin');
export const requireBuyer = requireRole('buyer', 'seller', 'admin');
