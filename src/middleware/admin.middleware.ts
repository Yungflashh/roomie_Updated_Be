// src/middleware/admin.middleware.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded.adminId) {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    req.user = { userId: decoded.adminId, ...decoded };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};