"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/auth.service.ts - UPDATED TO USE EXISTING POINTS SERVICE
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const points_service_1 = __importDefault(require("./points.service"));
class AuthService {
    /**
     * Helper to format user response with profile completion
     */
    formatUserResponse(user) {
        const profileCompletion = user.getProfileCompletion();
        return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            photos: user.photos,
            bio: user.bio,
            occupation: user.occupation,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests,
            languages: user.languages,
            socialLinks: user.socialLinks,
            verified: user.verified,
            emailVerified: user.emailVerified,
            subscription: user.subscription,
            gamification: user.gamification,
            // Profile completion
            isProfileComplete: profileCompletion.isComplete,
            profileCompletionPercentage: profileCompletion.percentage,
            missingProfileFields: profileCompletion.missingFields,
            age: user.age,
        };
    }
    /**
     * Register new user
     */
    async register(data) {
        const { email, password, firstName, lastName, dateOfBirth, gender } = data;
        // Check if user exists
        const existingUser = await models_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Create user
        const user = await models_1.User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            provider: 'email',
            gamification: {
                points: 0,
                level: 1,
                badges: ['newcomer'],
                achievements: [],
                streak: 0,
                lastActiveDate: new Date(),
            },
        });
        // Award signup bonus through points service
        try {
            await points_service_1.default.addPoints({
                userId: user._id.toString(),
                amount: 100,
                type: 'bonus',
                reason: 'Welcome bonus for signing up',
                metadata: { source: 'registration' },
            });
            logger_1.default.info(`Signup bonus awarded to: ${email}`);
        }
        catch (error) {
            logger_1.default.error('Error awarding signup bonus:', error);
        }
        // Generate tokens
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Save refresh token
        user.refreshToken = refreshToken;
        user.lastSeen = new Date();
        await user.save();
        logger_1.default.info(`New user registered: ${email}`);
        return {
            user: this.formatUserResponse(user),
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
        const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
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
        // Award daily login bonus through points service
        let dailyReward = {
            awarded: false,
        };
        try {
            const result = await points_service_1.default.awardDailyLoginBonus(user._id.toString());
            if (result.awarded) {
                // Fetch updated user data to get streak and level info
                const updatedUser = await models_1.User.findById(user._id);
                dailyReward = {
                    awarded: true,
                    points: result.amount,
                    streak: updatedUser?.gamification?.streak || 1,
                    newBalance: result.newBalance,
                };
                logger_1.default.info(`Daily login bonus awarded to ${email}: ${result.amount} points`);
            }
        }
        catch (error) {
            logger_1.default.error('Error awarding daily login bonus:', error);
        }
        // Generate tokens
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Update refresh token and last seen
        user.refreshToken = refreshToken;
        user.lastSeen = new Date();
        await user.save();
        // Fetch fresh user data for response
        const freshUser = await models_1.User.findById(user._id);
        if (!freshUser) {
            throw new Error('User not found');
        }
        logger_1.default.info(`User logged in: ${email}`);
        return {
            user: this.formatUserResponse(freshUser),
            accessToken,
            refreshToken,
            dailyReward,
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
     * Get user profile with completion status
     */
    async getUserProfileWithCompletion(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            user: this.formatUserResponse(user),
        };
    }
    /**
     * Get profile completion status only
     */
    async getProfileCompletion(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.getProfileCompletion();
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
    /**
     * Get user's current streak
     */
    async getUserStreak(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            currentStreak: user.gamification?.streak || 0,
            lastLoginDate: user.gamification?.lastActiveDate || user.lastSeen || null,
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map