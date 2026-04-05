"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    async getUserById(userId, currentUserId) {
        const user = await models_1.User.findById(userId)
            .select('firstName lastName email phoneNumber profilePhoto photos bio occupation ' +
            'gender dateOfBirth location preferences lifestyle interests languages ' +
            'socialLinks verified emailVerified createdAt lastSeen subscription')
            .lean();
        if (!user) {
            throw new Error('User not found');
        }
        // Check blocked status if viewing another user
        if (currentUserId && currentUserId !== userId) {
            const currentUser = await models_1.User.findById(currentUserId).select('blockedUsers');
            if (currentUser?.blockedUsers?.some((id) => id.toString() === userId)) {
                throw new Error('You have blocked this user');
            }
            if (user.blockedUsers?.some((id) => id.toString() === currentUserId)) {
                throw new Error('This user has blocked you');
            }
        }
        return {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profilePhoto: user.profilePhoto,
            photos: user.photos || [],
            bio: user.bio,
            occupation: user.occupation,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests || [],
            languages: user.languages || [],
            socialLinks: user.socialLinks || [],
            verified: user.verified,
            emailVerified: user.emailVerified,
            subscription: user.subscription,
            createdAt: user.createdAt,
            clan: await this.getUserClanInfo(userId),
        };
    }
    /**
     * Get clan info for a user (lightweight)
     */
    async getUserClanInfo(userId) {
        try {
            const { Clan } = await Promise.resolve().then(() => __importStar(require('../models/Clan')));
            const clan = await Clan.findOne({ 'members.user': userId })
                .select('name tag emoji color level badges')
                .lean();
            if (!clan)
                return null;
            return { name: clan.name, tag: clan.tag, emoji: clan.emoji, color: clan.color, level: clan.level, badges: clan.badges || [] };
        }
        catch {
            return null;
        }
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
     * Update user profile
     */
    async updateUser(userId, updateData) {
        // Fields that cannot be updated directly
        const forbiddenFields = ['password', 'email', 'refreshToken', 'likes', 'passes', 'blockedUsers', 'reportedBy'];
        // Remove forbidden fields
        forbiddenFields.forEach(field => {
            delete updateData[field];
        });
        const user = await models_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).select('-password -refreshToken');
        if (!user) {
            throw new Error('User not found');
        }
        return {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profilePhoto: user.profilePhoto,
            photos: user.photos || [],
            bio: user.bio,
            occupation: user.occupation,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests || [],
            languages: user.languages || [],
            socialLinks: user.socialLinks || [],
            verified: user.verified,
        };
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
        const { Report } = await Promise.resolve().then(() => __importStar(require('../models/Report')));
        // Check for duplicate report
        const existing = await Report.findOne({ reporter: userId, reported: targetUserId, status: 'pending' });
        if (existing) {
            throw new Error('You have already reported this user.');
        }
        await Report.create({ reporter: userId, reported: targetUserId, reason });
        // Also track on user document
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