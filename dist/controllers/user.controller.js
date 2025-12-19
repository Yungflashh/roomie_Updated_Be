"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
class UserController {
    // src/controllers/user.controller.ts
    // Update getUserProfile method
    /**
      * Get user profile by ID (GET /users/:userId)
      */
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user?.userId;
            logger_1.default.info(`Getting profile for user: ${userId}`);
            const user = await user_service_1.default.getUserById(userId, currentUserId);
            res.status(200).json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            logger_1.default.error('Get user profile error:', error);
            const statusCode = error.message.includes('blocked') ? 403 :
                error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to fetch user profile',
            });
        }
    }
    // src/controllers/user.controller.ts
    async getMyProfile(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            // Get profile completion details
            const profileCompletion = user.getProfileCompletion();
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        ...user.toJSON(),
                        isProfileComplete: profileCompletion.isComplete,
                        profileCompletionPercentage: profileCompletion.percentage,
                        missingProfileFields: profileCompletion.missingFields,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get my profile error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch profile',
            });
        }
    }
    // src/controllers/user.controller.ts - Add this method
    async getProfileCompletion(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
                return;
            }
            const completion = user.getProfileCompletion();
            res.status(200).json({
                success: true,
                data: {
                    isComplete: completion.isComplete,
                    percentage: completion.percentage,
                    missingFields: completion.missingFields,
                    completedFields: completion.completedFields,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Get profile completion error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get profile completion',
            });
        }
    }
    async updateMyProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                });
                return;
            }
            logger_1.default.info(`Updating profile for current user: ${userId}`);
            const user = await user_service_1.default.updateUser(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user },
            });
        }
        catch (error) {
            logger_1.default.error('Update my profile error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile',
            });
        }
    }
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            logger_1.default.info(`Updating profile for user: ${userId}`);
            const user = await user_service_1.default.updateProfile(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user },
            });
        }
        catch (error) {
            logger_1.default.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile',
            });
        }
    }
    async updatePreferences(req, res) {
        try {
            const userId = req.user?.userId;
            logger_1.default.info(`Updating preferences for user: ${userId}`);
            const preferences = await user_service_1.default.updatePreferences(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Preferences updated successfully',
                data: { preferences },
            });
        }
        catch (error) {
            logger_1.default.error('Update preferences error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update preferences',
            });
        }
    }
    async updateLifestyle(req, res) {
        try {
            const userId = req.user?.userId;
            logger_1.default.info(`Updating lifestyle for user: ${userId}`);
            const lifestyle = await user_service_1.default.updateLifestyle(userId, req.body);
            res.status(200).json({
                success: true,
                message: 'Lifestyle updated successfully',
                data: { lifestyle },
            });
        }
        catch (error) {
            logger_1.default.error('Update lifestyle error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update lifestyle',
            });
        }
    }
    async updateLocation(req, res) {
        try {
            const userId = req.user?.userId;
            const { latitude, longitude, address, city, state, country } = req.body;
            logger_1.default.info(`Updating location for user: ${userId}`);
            const location = await user_service_1.default.updateLocation(userId, latitude, longitude, address, city, state, country);
            res.status(200).json({
                success: true,
                message: 'Location updated successfully',
                data: { location },
            });
        }
        catch (error) {
            logger_1.default.error('Update location error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update location',
            });
        }
    }
    async uploadProfilePhoto(req, res) {
        try {
            const userId = req.user?.userId;
            const cloudinaryResult = req.cloudinaryResult;
            if (!cloudinaryResult) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
                return;
            }
            // Update user with Cloudinary URL
            await User_1.User.findByIdAndUpdate(userId, {
                profilePhoto: cloudinaryResult.url,
            });
            logger_1.default.info(`Profile photo uploaded for user ${userId}: ${cloudinaryResult.url}`);
            res.status(200).json({
                success: true,
                message: 'Profile photo uploaded successfully',
                data: {
                    profilePhoto: cloudinaryResult.url,
                    publicId: cloudinaryResult.publicId,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Upload profile photo error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload profile photo',
            });
        }
    }
    /**
     * Add photo to gallery
     */
    async addPhoto(req, res) {
        try {
            const userId = req.user?.userId;
            const cloudinaryResult = req.cloudinaryResult;
            if (!cloudinaryResult) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
                return;
            }
            // Check max photos limit
            const user = await User_1.User.findById(userId);
            const maxPhotos = parseInt(process.env.MAX_PROFILE_PHOTOS || '10');
            if (user && user.photos.length >= maxPhotos) {
                res.status(400).json({
                    success: false,
                    message: `Maximum ${maxPhotos} photos allowed`,
                });
                return;
            }
            // Add Cloudinary URL to photos array
            await User_1.User.findByIdAndUpdate(userId, {
                $push: { photos: cloudinaryResult.url },
            });
            logger_1.default.info(`Photo added for user ${userId}: ${cloudinaryResult.url}`);
            res.status(200).json({
                success: true,
                message: 'Photo added successfully',
                data: {
                    photoUrl: cloudinaryResult.url,
                    publicId: cloudinaryResult.publicId,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Add photo error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add photo',
            });
        }
    }
    async removePhoto(req, res) {
        try {
            const userId = req.user?.userId;
            const { photoUrl } = req.body;
            logger_1.default.info(`Removing photo for user: ${userId}, url: ${photoUrl}`);
            await user_service_1.default.removePhoto(userId, photoUrl);
            res.status(200).json({
                success: true,
                message: 'Photo removed successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Remove photo error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove photo',
            });
        }
    }
    async blockUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            logger_1.default.info(`User ${userId} blocking user ${targetUserId}`);
            await user_service_1.default.blockUser(userId, targetUserId);
            res.status(200).json({
                success: true,
                message: 'User blocked successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Block user error:', error);
            const statusCode = error.message.includes('Cannot') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to block user',
            });
        }
    }
    async unblockUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            logger_1.default.info(`User ${userId} unblocking user ${targetUserId}`);
            await user_service_1.default.unblockUser(userId, targetUserId);
            res.status(200).json({
                success: true,
                message: 'User unblocked successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Unblock user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to unblock user',
            });
        }
    }
    async reportUser(req, res) {
        try {
            const userId = req.user?.userId;
            const { targetUserId } = req.params;
            const { reason } = req.body;
            logger_1.default.info(`User ${userId} reporting user ${targetUserId}, reason: ${reason}`);
            await user_service_1.default.reportUser(userId, targetUserId, reason);
            res.status(200).json({
                success: true,
                message: 'User reported successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Report user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to report user',
            });
        }
    }
    async addInterests(req, res) {
        try {
            const userId = req.user?.userId;
            const { interests } = req.body;
            logger_1.default.info(`Adding interests for user: ${userId}`);
            const updatedInterests = await user_service_1.default.addInterests(userId, interests);
            res.status(200).json({
                success: true,
                message: 'Interests added successfully',
                data: { interests: updatedInterests },
            });
        }
        catch (error) {
            logger_1.default.error('Add interests error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add interests',
            });
        }
    }
    async removeInterest(req, res) {
        try {
            const userId = req.user?.userId;
            const { interest } = req.body;
            logger_1.default.info(`Removing interest for user: ${userId}, interest: ${interest}`);
            const updatedInterests = await user_service_1.default.removeInterest(userId, interest);
            res.status(200).json({
                success: true,
                message: 'Interest removed successfully',
                data: { interests: updatedInterests },
            });
        }
        catch (error) {
            logger_1.default.error('Remove interest error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to remove interest',
            });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map