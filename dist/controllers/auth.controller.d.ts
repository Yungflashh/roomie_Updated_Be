import { Response } from 'express';
import { AuthRequest } from '../types';
declare class AuthController {
    /**
     * @route   POST /api/v1/auth/register
     * @access  Public
     */
    register(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/login
     * @access  Public
     */
    login(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/refresh-token
     * @access  Public
     */
    refreshToken(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/logout
     * @access  Private
     */
    logout(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   GET /api/v1/auth/me
     * @access  Private
     */
    getMe(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   GET /api/v1/auth/profile-completion
     * @access  Private
     */
    getProfileCompletion(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   PUT /api/v1/auth/fcm-token
     * @access  Private
     */
    updateFcmToken(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   PUT /api/v1/auth/change-password
     * @access  Private
     */
    changePassword(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   DELETE /api/v1/auth/account
     * @access  Private
     */
    deleteAccount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   GET /api/v1/auth/streak
     * @access  Private
     */
    getStreak(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/send-verification
     * @access  Private
     */
    sendVerification(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/verify-email
     * @access  Private
     */
    verifyEmail(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/forgot-password
     * @access  Public
     */
    forgotPassword(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/verify-reset-code
     * @access  Public
     */
    verifyResetCode(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/reset-password
     * @access  Public
     */
    resetPassword(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/google
     * @access  Public
     * @body    { idToken: string }
     */
    googleLogin(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @route   POST /api/v1/auth/apple
     * @access  Public
     * @body    { identityToken, authorizationCode, email?, firstName?, lastName? }
     */
    appleLogin(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map