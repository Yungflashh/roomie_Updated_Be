"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
class UserController {
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user?.userId;
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
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
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
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
                return;
            }
            const mediaHash = req.mediaHash;
            const fileUrl = await user_service_1.default.uploadProfilePhoto(userId, req.file, mediaHash);
            res.status(200).json({
                success: true,
                message: 'Profile photo uploaded successfully',
                data: { profilePhoto: fileUrl },
            });
        }
        catch (error) {
            logger_1.default.error('Upload profile photo error:', error);
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload profile photo',
            });
        }
    }
    async addPhoto(req, res) {
        try {
            const userId = req.user?.userId;
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
                return;
            }
            const mediaHash = req.mediaHash;
            const fileUrl = await user_service_1.default.addPhoto(userId, req.file, mediaHash);
            res.status(200).json({
                success: true,
                message: 'Photo added successfully',
                data: { photoUrl: fileUrl },
            });
        }
        catch (error) {
            logger_1.default.error('Add photo error:', error);
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            const statusCode = error.message.includes('Maximum') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to add photo',
            });
        }
    }
    async removePhoto(req, res) {
        try {
            const userId = req.user?.userId;
            const { photoUrl } = req.body;
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