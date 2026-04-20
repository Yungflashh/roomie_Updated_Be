import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import logger from '../utils/logger';

/**
 * Verifies the Bearer access token on every protected route.
 * Also checks the user's moderation status and auto-lifts expired suspensions/bans.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAccessToken(token);

      if (!decoded.isAdmin) {
        const { User } = await import('../models');
        const user = await User.findById(decoded.userId).select('moderation isActive').lean();
        if (user) {
          const mod = (user as any).moderation;
          if (mod?.status === 'restricted') {
            res.status(403).json({
              success: false,
              code: 'ACCOUNT_RESTRICTED',
              message: `Your account has been permanently restricted. Reason: ${mod.reason || 'Violation of community guidelines'}. Contact support@roomieng.com for appeals.`,
            });
            return;
          }
          if (mod?.status === 'suspended' && mod.suspendedUntil && new Date(mod.suspendedUntil) > new Date()) {
            const until = new Date(mod.suspendedUntil).toLocaleDateString('en-NG', { dateStyle: 'medium' });
            res.status(403).json({
              success: false,
              code: 'ACCOUNT_SUSPENDED',
              message: `Your account is suspended until ${until}. Reason: ${mod.reason || 'Violation of community guidelines'}.`,
            });
            return;
          }
          if (mod?.status === 'banned' && mod.suspendedUntil && new Date(mod.suspendedUntil) > new Date()) {
            const mins = Math.ceil((new Date(mod.suspendedUntil).getTime() - Date.now()) / 60000);
            res.status(403).json({
              success: false,
              code: 'ACCOUNT_BANNED',
              message: `Your account is temporarily banned for ${mins} more minute(s). Reason: ${mod.reason || 'Violation of community guidelines'}.`,
            });
            return;
          }
          if (mod?.status !== 'active' && mod?.status !== 'restricted') {
            if (!mod?.suspendedUntil || new Date(mod.suspendedUntil) <= new Date()) {
              await User.findByIdAndUpdate(decoded.userId, { 'moderation.status': 'active' });
            }
          }
        }
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Invalid access token',
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Attempts to populate `req.user` from a Bearer token if present,
 * but does not reject the request if the token is absent or invalid.
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch {
        // Token invalid — continue without user context
      }
    }

    next();
  } catch (error) {
    next();
  }
};
