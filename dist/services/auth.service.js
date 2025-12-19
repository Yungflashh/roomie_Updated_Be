"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    /**
     * Register new user
     */
    async register(data) {
        const { email, password, firstName, lastName, dateOfBirth, gender } = data;
        // Check if user exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Create user
        const user = await models_1.User.create({
            email,
            password,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            provider: 'email',
            gamification: {
                points: 100,
                level: 1,
                badges: ['newcomer'],
                achievements: [],
                streak: 0,
            },
        });
        // Generate tokens
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();
        logger_1.default.info(`New user registered: ${email}`);
        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto,
                subscription: user.subscription,
                gamification: user.gamification,
            },
            accessToken,
            refreshToken,
        };
    }
    /**
     * Login user
     */
    async login(data) {
        const { email, password } = data;
        // Find user
        const user = await models_1.User.findOne({ email }).select('+password +refreshToken');
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Check if active
        if (!user.isActive) {
            throw new Error('Account has been deactivated');
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Generate tokens
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Update refresh token and last seen
        user.refreshToken = refreshToken;
        user.lastSeen = new Date();
        await user.save();
        logger_1.default.info(`User logged in: ${email}`);
        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto,
                subscription: user.subscription,
                gamification: user.gamification,
            },
            accessToken,
            refreshToken,
        };
    }
    /**
     * Refresh access token
     */
    async refreshAccessToken(userId, refreshToken) {
        const user = await models_1.User.findById(userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }
        // Generate new tokens
        const tokens = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Update refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return tokens;
    }
    /**
     * Logout user
     */
    async logout(userId) {
        const user = await models_1.User.findById(userId);
        if (user) {
            user.refreshToken = undefined;
            user.lastSeen = new Date();
            await user.save();
        }
    }
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    /**
     * Update FCM token
     */
    async updateFcmToken(userId, fcmToken) {
        await models_1.User.findByIdAndUpdate(userId, { fcmToken });
    }
    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        // Update password
        user.password = newPassword;
        await user.save();
        logger_1.default.info(`Password changed for user: ${user.email}`);
    }
    /**
     * Delete account (soft delete)
     */
    async deleteAccount(userId, password) {
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Password is incorrect');
        }
        // Soft delete
        user.isActive = false;
        await user.save();
        logger_1.default.info(`Account deleted for user: ${user.email}`);
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map