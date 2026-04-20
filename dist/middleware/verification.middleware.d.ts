import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
/**
 * Requires the authenticated user to have completed identity verification
 * before accessing the route. Returns 403 with code VERIFICATION_REQUIRED otherwise.
 */
export declare function requireVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=verification.middleware.d.ts.map