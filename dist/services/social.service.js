"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/social.service.ts
const User_1 = require("../models/User");
const logger_1 = __importDefault(require("../utils/logger"));
class SocialService {
    /**
     * Add/Update social media link
     */
    async linkSocial(userId, platform, username) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Generate URL based on platform
        const url = this.generateSocialUrl(platform, username);
        const socialLink = {
            platform: platform,
            username,
            url,
            connected: true,
            connectedAt: new Date(),
        };
        // Initialize socialLinks array if not exists
        if (!user.socialLinks) {
            user.socialLinks = [];
        }
        // Check if platform already linked
        const existingIndex = user.socialLinks.findIndex((link) => link.platform === platform);
        if (existingIndex >= 0) {
            // Update existing
            user.socialLinks[existingIndex] = socialLink;
        }
        else {
            // Add new
            user.socialLinks.push(socialLink);
        }
        await user.save();
        logger_1.default.info(`User ${userId} linked ${platform} account: ${username}`);
        return user.socialLinks;
    }
    /**
     * Remove social media link
     */
    async unlinkSocial(userId, platform) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.socialLinks) {
            return [];
        }
        // Prevent unlinking last social account
        const connectedCount = user.socialLinks.filter((link) => link.connected).length;
        if (connectedCount <= 1) {
            throw new Error('Cannot unlink your last social media account. At least one is required for verification.');
        }
        // Prevent unlinking during pending verification
        if (user.metadata?.verificationStatus === 'pending') {
            throw new Error('Cannot unlink social accounts while verification is under review.');
        }
        user.socialLinks = user.socialLinks.filter((link) => link.platform !== platform);
        await user.save();
        logger_1.default.info(`User ${userId} unlinked ${platform} account`);
        return user.socialLinks;
    }
    /**
     * Get user's social links
     */
    async getSocialLinks(userId) {
        const user = await User_1.User.findById(userId).select('socialLinks');
        if (!user) {
            throw new Error('User not found');
        }
        return user.socialLinks || [];
    }
    /**
     * Generate social media URL from username
     */
    generateSocialUrl(platform, username) {
        const cleanUsername = username.replace('@', '');
        const urls = {
            instagram: `https://instagram.com/${cleanUsername}`,
            facebook: `https://facebook.com/${cleanUsername}`,
            twitter: `https://twitter.com/${cleanUsername}`,
            linkedin: `https://linkedin.com/in/${cleanUsername}`,
            tiktok: `https://tiktok.com/@${cleanUsername}`,
        };
        return urls[platform] || '';
    }
}
exports.default = new SocialService();
//# sourceMappingURL=social.service.js.map