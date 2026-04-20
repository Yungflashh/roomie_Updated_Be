import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
/**
 * Verifies the request carries a valid admin JWT.
 * Admin tokens are issued by the admin login flow and contain `adminId` in the payload.
 */
export declare const authenticateAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=admin.middleware.d.ts.map