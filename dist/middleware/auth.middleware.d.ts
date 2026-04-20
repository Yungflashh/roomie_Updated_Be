import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
/**
 * Verifies the Bearer access token on every protected route.
 * Also checks the user's moderation status and auto-lifts expired suspensions/bans.
 */
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Attempts to populate `req.user` from a Bearer token if present,
 * but does not reject the request if the token is absent or invalid.
 */
export declare const optionalAuthenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map