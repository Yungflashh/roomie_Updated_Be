import { Response } from 'express';
import { AuthRequest } from '../types';
declare class AuthController {
    /**
     * Register new user
     */
    register(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Login user
     */
    login(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Refresh access token
     */
    refreshToken(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Logout user
     */
    logout(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get current user profile
     */
    getMe(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get profile completion status
     */
    getProfileCompletion(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Update FCM token
     */
    updateFcmToken(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Change password
     */
    changePassword(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete account
     */
    deleteAccount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user's login streak
     * GET /api/auth/streak
     */
    getStreak(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map