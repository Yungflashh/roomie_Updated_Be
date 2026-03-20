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
    /**
     * Send email verification code
     * POST /api/v1/auth/send-verification
     */
    sendVerification(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify email with OTP code
     * POST /api/v1/auth/verify-email
     */
    verifyEmail(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Forgot password — send reset code
     * POST /api/v1/auth/forgot-password
     */
    forgotPassword(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify reset code
     * POST /api/v1/auth/verify-reset-code
     */
    verifyResetCode(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    resetPassword(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map