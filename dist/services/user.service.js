"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const duplicateDetection_service_1 = __importDefault(require("./duplicateDetection.service"));
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId, currentUserId) {
        const user = await models_1.User.findById(userId).select('-password -refreshToken');
        if (!user) {
            throw new Error('User not found');
        }
        // Check if blocked
        if (currentUserId && user.blockedUsers.includes(currentUserId)) {
            throw new Error('You are blocked by this user');
        }
        return user;
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        // Remove sensitive fields
        delete updates.email;
        delete updates.password;
        delete updates.provider;
        delete updates.subscription;
        delete updates.gamification;
        const user = await models_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    /**
     * Update preferences
     */
    async updatePreferences(userId, preferences) {
        const user = await models_1.User.findByIdAndUpdate(userId, { $set: { preferences } }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.preferences;
    }
    /**
     * Update lifestyle
     */
    async updateLifestyle(userId, lifestyle) {
        const user = await models_1.User.findByIdAndUpdate(userId, { $set: { lifestyle } }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.lifestyle;
    }
    /**
     * Update location
     */
    async updateLocation(userId, latitude, longitude, address, city, state, country) {
        const user = await models_1.User.findByIdAndUpdate(userId, {
            $set: {
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                    address,
                    city,
                    state,
                    country,
                },
            },
        }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.location;
    }
    /**
     * Upload profile photo
     */
    async uploadProfilePhoto(userId, file, mediaHash) {
        const fileUrl = `/uploads/profiles/${file.filename}`;
        // Save hash
        if (mediaHash) {
            await duplicateDetection_service_1.default.saveMediaHash(userId, file.originalname, fileUrl, 'image', mediaHash, undefined, file.size);
        }
        // Update user
        await models_1.User.findByIdAndUpdate(userId, { $set: { profilePhoto: fileUrl } });
        return fileUrl;
    }
    /**
     * Add photo to gallery
     */
    async addPhoto(userId, file, mediaHash) {
        const fileUrl = `/uploads/profiles/${file.filename}`;
        // Check max photos limit
        const user = await models_1.User.findById(userId);
        const maxPhotos = parseInt(process.env.MAX_PROFILE_PHOTOS || '10');
        if (user && user.photos.length >= maxPhotos) {
            throw new Error(`Maximum ${maxPhotos} photos allowed`);
        }
        // Save hash
        if (mediaHash) {
            await duplicateDetection_service_1.default.saveMediaHash(userId, file.originalname, fileUrl, 'image', mediaHash, undefined, file.size);
        }
        // Add photo
        await models_1.User.findByIdAndUpdate(userId, { $push: { photos: fileUrl } });
        return fileUrl;
    }
    /**
     * Remove photo
     */
    async removePhoto(userId, photoUrl) {
        await models_1.User.findByIdAndUpdate(userId, { $pull: { photos: photoUrl } });
        // Delete file
        const filePath = path_1.default.join(process.cwd(), 'public', photoUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    /**
     * Block user
     */
    async blockUser(userId, targetUserId) {
        if (userId === targetUserId) {
            throw new Error('Cannot block yourself');
        }
        await models_1.User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetUserId } });
    }
    /**
     * Unblock user
     */
    async unblockUser(userId, targetUserId) {
        await models_1.User.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetUserId } });
    }
    /**
     * Report user
     */
    async reportUser(userId, targetUserId, reason) {
        await models_1.User.findByIdAndUpdate(targetUserId, { $addToSet: { reportedBy: userId } });
        logger_1.default.warn(`User ${userId} reported user ${targetUserId}: ${reason}`);
    }
    /**
     * Add interests
     */
    async addInterests(userId, interests) {
        const user = await models_1.User.findByIdAndUpdate(userId, { $addToSet: { interests: { $each: interests } } }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.interests;
    }
    /**
     * Remove interest
     */
    async removeInterest(userId, interest) {
        const user = await models_1.User.findByIdAndUpdate(userId, { $pull: { interests: interest } }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user.interests;
    }
    /**
     * Search users by location
     */
    async searchByLocation(latitude, longitude, radius = 50, limit = 20) {
        const users = await models_1.User.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: radius * 1000, // Convert km to meters
                },
            },
            isActive: true,
        })
            .limit(limit)
            .select('-password -refreshToken');
        return users;
    }
}
exports.default = new UserService();
//# sourceMappingURL=user.service.js.map