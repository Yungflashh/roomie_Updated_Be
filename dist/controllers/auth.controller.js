"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const audit_1 = require("../utils/audit");
class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const result = await auth_service_1.default.register(req.body);
            await (0, audit_1.logAudit)({
                actor: { id: result.user?.id?.toString() || '', name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`, email: result.user?.email || '' },
                actorType: 'user', action: 'register', category: 'auth',
                details: 'New user registered', req
            });
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            const statusCode = error.message.includes('already exists') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    }
    /**
     * Login user
     */
    async login(req, res) {
        try {
            const result = await auth_service_1.default.login(req.body);
            // Build message based on daily reward
            let message = 'Login successful';
            if (result.dailyReward?.awarded) {
                const points = result.dailyReward.points || 0;
                const streak = result.dailyReward.streak || 1;
                if (streak >= 7) {
                    message = `Welcome back! +${points} points 🔥 ${streak} day streak!`;
                }
                else {
                    message = `Welcome back! +${points} points`;
                }
            }
            await (0, audit_1.logAudit)({
                actor: { id: result.user?.id?.toString() || '', name: `${result.user?.firstName || ''} ${result.user?.lastName || ''}`, email: result.user?.email || '' },
                actorType: 'user', action: 'login', category: 'auth',
                details: 'User logged in', req
            });
            res.status(200).json({
                success: true,
                message,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                },
                dailyReward: result.dailyReward,
            });
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            const statusCode = error.message.includes('Invalid') ? 401 :
                error.message.includes('deactivated') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Login failed',
            });
        }
    }
    /**
     * Refresh access token
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
            const tokens = await auth_service_1.default.refreshAccessToken(decoded.userId, refreshToken);
            res.status(200).json({
                success: true,
                data: tokens,
            });
        }
        catch (error) {
            logger_1.default.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid refresh token',
            });
        }
    }
    /**
     * Logout user
     */
    async logout(req, res) {
        try {
            const userId = req.user?.userId;
            if (userId) {
                await auth_service_1.default.logout(userId);
            }
            res.status(200).json({
                success: true,
                message: 'Logout successful',
            });
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
            });
        }
    }
    /**
     * Get current user profile
     */
    async getMe(req, res) {
        try {
            const userId = req.user?.userId;
            const result = await auth_service_1.default.getUserProfileWithCompletion(userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get me error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'User not found',
            });
        }
    }
    /**
     * Get profile completion status
     */
    async getProfileCompletion(req, res) {
        try {
            const userId = req.user?.userId;
            const completion = await auth_service_1.default.getProfileCompletion(userId);
            res.status(200).json({
                success: true,
                data: completion,
            });
        }
        catch (error) {
            logger_1.default.error('Get profile completion error:', error);
            res.status(404).json({
                success: false,
                message: error.message || 'User not found',
            });
        }
    }
    /**
     * Update FCM token
     */
    async updateFcmToken(req, res) {
        try {
            const userId = req.user?.userId;
            const { fcmToken } = req.body;
            logger_1.default.info(`🔔 [FCM] Token update request from user ${userId}`);
            logger_1.default.info(`🔔 [FCM] Token received: ${fcmToken ? fcmToken.substring(0, 30) + '...' : '(empty)'}`);
            if (fcmToken === undefined) {
                logger_1.default.warn('🔔 [FCM] No fcmToken in request body');
                res.status(400).json({
                    success: false,
                    message: 'fcmToken is required in request body',
                });
                return;
            }
            await auth_service_1.default.updateFcmToken(userId, fcmToken);
            logger_1.default.info(`🔔 [FCM] ✅ Token saved for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'FCM token updated',
            });
        }
        catch (error) {
            logger_1.default.error('🔔 [FCM] ❌ Update FCM token error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update FCM token',
            });
        }
    }
    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const userId = req.user?.userId;
            const { currentPassword, newPassword } = req.body;
            await auth_service_1.default.changePassword(userId, currentPassword, newPassword);
            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Change password error:', error);
            const statusCode = error.message.includes('incorrect') ? 401 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to change password',
            });
        }
    }
    /**
     * Delete account
     */
    async deleteAccount(req, res) {
        try {
            const userId = req.user?.userId;
            const { password } = req.body;
            await auth_service_1.default.deleteAccount(userId, password);
            res.status(200).json({
                success: true,
                message: 'Account deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete account error:', error);
            const statusCode = error.message.includes('incorrect') ? 401 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete account',
            });
        }
    }
    /**
     * Get user's login streak
     * GET /api/auth/streak
     */
    async getStreak(req, res) {
        try {
            const userId = req.user?.userId;
            const streak = await auth_service_1.default.getUserStreak(userId);
            res.status(200).json({
                success: true,
                data: streak,
            });
        }
        catch (error) {
            logger_1.default.error('Get streak error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get streak',
            });
        }
    }
    /**
     * Send email verification code
     * POST /api/v1/auth/send-verification
     */
    async sendVerification(req, res) {
        try {
            const userId = req.user?.userId;
            await auth_service_1.default.sendVerificationEmail(userId);
            res.status(200).json({
                success: true,
                message: 'Verification code sent to your email',
            });
        }
        catch (error) {
            logger_1.default.error('Send verification error:', error);
            const statusCode = error.message.includes('already verified') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to send verification email',
            });
        }
    }
    /**
     * Verify email with OTP code
     * POST /api/v1/auth/verify-email
     */
    async verifyEmail(req, res) {
        try {
            const userId = req.user?.userId;
            const { code } = req.body;
            if (!code) {
                res.status(400).json({ success: false, message: 'Verification code is required' });
                return;
            }
            await auth_service_1.default.verifyEmail(userId, code);
            res.status(200).json({
                success: true,
                message: 'Email verified successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Verify email error:', error);
            const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Verification failed',
            });
        }
    }
    /**
     * Forgot password — send reset code
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Email is required' });
                return;
            }
            await auth_service_1.default.forgotPassword(email);
            // Always return success to avoid email enumeration
            res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a reset code has been sent',
            });
        }
        catch (error) {
            logger_1.default.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process request',
            });
        }
    }
    /**
     * Verify reset code
     * POST /api/v1/auth/verify-reset-code
     */
    async verifyResetCode(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                res.status(400).json({ success: false, message: 'Email and code are required' });
                return;
            }
            const resetToken = await auth_service_1.default.verifyResetCode(email, code);
            res.status(200).json({
                success: true,
                message: 'Code verified',
                data: { resetToken },
            });
        }
        catch (error) {
            logger_1.default.error('Verify reset code error:', error);
            const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Verification failed',
            });
        }
    }
    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res) {
        try {
            const { email, resetToken, newPassword } = req.body;
            if (!email || !resetToken || !newPassword) {
                res.status(400).json({ success: false, message: 'Email, reset token, and new password are required' });
                return;
            }
            await auth_service_1.default.resetPassword(email, resetToken, newPassword);
            res.status(200).json({
                success: true,
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Reset password error:', error);
            const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Password reset failed',
            });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map