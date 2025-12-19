"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const result = await auth_service_1.default.register(req.body);
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
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
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
            const user = await auth_service_1.default.getUserProfile(userId);
            res.status(200).json({
                success: true,
                data: { user },
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
     * Update FCM token
     */
    async updateFcmToken(req, res) {
        try {
            const userId = req.user?.userId;
            const { fcmToken } = req.body;
            await auth_service_1.default.updateFcmToken(userId, fcmToken);
            res.status(200).json({
                success: true,
                message: 'FCM token updated',
            });
        }
        catch (error) {
            logger_1.default.error('Update FCM token error:', error);
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
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map