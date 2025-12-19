"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const social_service_1 = __importDefault(require("../services/social.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class SocialController {
    /**
     * Link social media account
     */
    async linkSocial(req, res) {
        try {
            const userId = req.user?.userId;
            const { platform, username } = req.body;
            if (!platform || !username) {
                res.status(400).json({
                    success: false,
                    message: 'Platform and username are required',
                });
                return;
            }
            const validPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
            if (!validPlatforms.includes(platform)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid platform',
                });
                return;
            }
            const socialLinks = await social_service_1.default.linkSocial(userId, platform, username);
            res.status(200).json({
                success: true,
                message: `${platform} account linked successfully`,
                data: { socialLinks },
            });
        }
        catch (error) {
            logger_1.default.error('Link social error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to link social account',
            });
        }
    }
    /**
     * Unlink social media account
     */
    async unlinkSocial(req, res) {
        try {
            const userId = req.user?.userId;
            const { platform } = req.params;
            const socialLinks = await social_service_1.default.unlinkSocial(userId, platform);
            res.status(200).json({
                success: true,
                message: `${platform} account unlinked successfully`,
                data: { socialLinks },
            });
        }
        catch (error) {
            logger_1.default.error('Unlink social error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to unlink social account',
            });
        }
    }
    /**
     * Get social links
     */
    async getSocialLinks(req, res) {
        try {
            const userId = req.user?.userId;
            const socialLinks = await social_service_1.default.getSocialLinks(userId);
            res.status(200).json({
                success: true,
                data: { socialLinks },
            });
        }
        catch (error) {
            logger_1.default.error('Get social links error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get social links',
            });
        }
    }
}
exports.default = new SocialController();
//# sourceMappingURL=social.controller.js.map