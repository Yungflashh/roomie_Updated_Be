import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models';

export async function requireVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }

    const user = await User.findById(userId).select('verified').lean();
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    if (!user.verified) {
      res.status(403).json({
        success: false,
        message: 'Account verification required. Please verify your identity to use this feature.',
        code: 'VERIFICATION_REQUIRED',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification check failed' });
  }
}
