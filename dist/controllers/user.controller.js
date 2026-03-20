"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_service_1 = __importDefault(require("../services/user.service"));
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
const audit_1 = require("../utils/audit");
const weeklyChallenge_service_1 = __importDefault(require("../services/weeklyChallenge.service"));
// Helper to get user actor info for audit logs
async function getActorInfo(userId) {
    try {
        const u = await User_1.User.findById(userId).select('firstName lastName email');
        if (u)
            return { id: userId, name: `${u.firstName} ${u.lastName}`, email: u.email };
    }
    catch { }
    return { id: userId, name: '', email: '' };
}
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
            logger_1.default.info(`Profile data for ${userId}: subscription=${JSON.stringify(user?.subscription)}, verified=${user?.verified}`);
            // Record profile visit & notify (in background, don't block response)
            if (currentUserId && currentUserId !== userId) {
                (async () => {
                    try {
                        const premiumService = require('../services/premium.service').default;
                        const isNewVisit = await premiumService.recordProfileVisit(currentUserId, userId);
                        // Only notify if this is a new visit (not within last 3 days)
                        if (isNewVisit) {
                            const { emitToUser } = require('../config/socket.config');
                            emitToUser(userId, 'notification', {
                                type: 'profile_view',
                                title: 'Profile Viewed',
                                message: 'Someone viewed your profile',
                                data: { viewerId: currentUserId },
                            });
                            const { Notification } = require('../models');
                            await Notification.create({
                                user: userId,
                                type: 'profile_view',
                                title: 'Profile Viewed',
                                body: 'Someone viewed your profile',
                                data: { viewerId: currentUserId },
                            }).catch((err) => {
                                logger_1.default.error('Profile view notification error:', err.message);
                            });
                        }
                    }
                    catch (err) {
                        // Silent — don't let visit tracking break profile fetch
                    }
                })();
            }
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
            const user = await User_1.User.findById(userId)
                .populate('blockedUsers', 'firstName lastName profilePhoto');
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'update_profile', category: 'profile',
                details: 'Updated profile', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'update_profile', category: 'profile',
                details: 'Updated profile', req
            });
            // Track challenge progress
            weeklyChallenge_service_1.default.trackAction(userId, 'profile_update').catch(e => logger_1.default.warn('Challenge tracking (profile_update) error:', e));
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'update_preferences', category: 'profile',
                details: 'Updated preferences', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'update_lifestyle', category: 'profile',
                details: 'Updated lifestyle', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'update_location', category: 'profile',
                details: 'Updated location', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'upload_profile_photo', category: 'profile',
                details: 'Uploaded profile photo', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'add_photo', category: 'profile',
                details: 'Added photo to gallery', req
            });
            // Track challenge progress
            weeklyChallenge_service_1.default.trackAction(userId, 'photo_upload').catch(e => logger_1.default.warn('Challenge tracking (photo_upload) error:', e));
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'remove_photo', category: 'profile',
                details: 'Removed photo', req
            });
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
            const targetInfo = await getActorInfo(targetUserId);
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'block_user', category: 'user_interaction',
                target: { type: 'user', id: targetUserId, name: targetInfo.name },
                details: `Blocked user ${targetInfo.name} (${targetInfo.email})`, req
            });
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
            const targetInfo = await getActorInfo(targetUserId);
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'unblock_user', category: 'user_interaction',
                target: { type: 'user', id: targetUserId, name: targetInfo.name },
                details: `Unblocked user ${targetInfo.name} (${targetInfo.email})`, req
            });
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
            const targetInfo = await getActorInfo(targetUserId);
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'report_user', category: 'user_interaction',
                target: { type: 'user', id: targetUserId, name: targetInfo.name },
                details: `Reported user ${targetInfo.name} (${targetInfo.email}). Reason: ${reason}`, req,
                metadata: { reason, reportedUser: { name: targetInfo.name, email: targetInfo.email } }
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'add_interests', category: 'profile',
                details: 'Added interests', req
            });
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
            await (0, audit_1.logAudit)({
                actor: await getActorInfo(userId),
                actorType: 'user', action: 'remove_interest', category: 'profile',
                details: `Removed interest: ${interest}`, req
            });
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
    async getNotificationSettings(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findById(userId).select('notificationSettings');
            res.json({ success: true, data: user?.notificationSettings || {} });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateNotificationSettings(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findByIdAndUpdate(userId, { $set: { notificationSettings: req.body } }, { new: true }).select('notificationSettings');
            res.json({ success: true, data: user?.notificationSettings });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPrivacySettings(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findById(userId).select('privacySettings');
            res.json({ success: true, data: user?.privacySettings || {} });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updatePrivacySettings(req, res) {
        try {
            const userId = req.user?.userId;
            const user = await User_1.User.findByIdAndUpdate(userId, { $set: { privacySettings: req.body } }, { new: true }).select('privacySettings');
            res.json({ success: true, data: user?.privacySettings });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteAccount(req, res) {
        try {
            const userId = req.user?.userId;
            const { password } = req.body;
            if (!password) {
                res.status(400).json({ success: false, message: 'Password is required' });
                return;
            }
            const user = await User_1.User.findById(userId).select('+password');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ success: false, message: 'Incorrect password' });
                return;
            }
            // Soft delete: deactivate the account
            user.isActive = false;
            await user.save();
            logger_1.default.info(`Account deletion requested by user ${userId}`);
            res.json({
                success: true,
                message: 'Account has been deactivated. It will be permanently deleted in 30 days.',
            });
        }
        catch (error) {
            logger_1.default.error('Delete account error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to delete account' });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map