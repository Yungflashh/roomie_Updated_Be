"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const social_auth_service_1 = __importDefault(require("../services/social-auth.service"));
const social_service_1 = __importDefault(require("../services/social.service"));
const social_auth_config_1 = require("../config/social-auth.config");
const logger_1 = __importDefault(require("../utils/logger"));
const axios_1 = __importDefault(require("axios"));
class SocialAuthController {
    /**
     * Initiate Facebook OAuth
     */
    async initiateFacebookAuth(req, res) {
        try {
            const userId = req.user?.userId;
            const clientId = process.env.FACEBOOK_APP_ID;
            const redirectUri = `${process.env.API_URL}/api/v1/social/facebook/callback`;
            const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
            const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&state=${state}` +
                `&scope=email,public_profile`;
            res.json({ success: true, data: { authUrl } });
        }
        catch (error) {
            logger_1.default.error('Initiate Facebook auth error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Facebook OAuth callback
     */
    async facebookCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code || !state) {
                res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('facebook', 'error', { message: 'Missing code or state' }));
                return;
            }
            // Decode state to get userId
            const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
            // Exchange code for access token
            const tokenResponse = await axios_1.default.get(`https://graph.facebook.com/v18.0/oauth/access_token?` +
                `client_id=${process.env.FACEBOOK_APP_ID}` +
                `&redirect_uri=${encodeURIComponent(`${process.env.API_URL}/api/v1/social/facebook/callback`)}` +
                `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
                `&code=${code}`);
            const accessToken = tokenResponse.data.access_token;
            // Get user profile
            const profileResponse = await axios_1.default.get(`https://graph.facebook.com/me?fields=id,name,email,picture,link&access_token=${accessToken}`);
            const fbProfile = profileResponse.data;
            const profile = {
                platform: 'facebook',
                id: fbProfile.id,
                username: fbProfile.name.replace(/\s+/g, '.').toLowerCase(),
                displayName: fbProfile.name,
                profileUrl: fbProfile.link || `https://facebook.com/${fbProfile.id}`,
                profilePhoto: fbProfile.picture?.data?.url,
                accessToken,
            };
            await social_auth_service_1.default.linkSocialAccount(userId, profile);
            // Redirect to mobile app
            res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('facebook', 'success', { username: profile.username }));
        }
        catch (error) {
            logger_1.default.error('Facebook callback error:', error);
            res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('facebook', 'error', { message: error.message }));
        }
    }
    /**
     * Initiate Instagram OAuth (via Facebook)
     */
    async initiateInstagramAuth(req, res) {
        try {
            const userId = req.user?.userId;
            const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID;
            const redirectUri = `${process.env.API_URL}/api/v1/social/instagram/callback`;
            const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
            // Instagram Basic Display API
            const authUrl = `https://api.instagram.com/oauth/authorize?` +
                `client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=user_profile,user_media` +
                `&response_type=code` +
                `&state=${state}`;
            res.json({ success: true, data: { authUrl } });
        }
        catch (error) {
            logger_1.default.error('Initiate Instagram auth error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Instagram OAuth callback
     */
    async instagramCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code || !state) {
                res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('instagram', 'error', { message: 'Missing code or state' }));
                return;
            }
            const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());
            // Exchange code for access token
            const tokenResponse = await axios_1.default.post('https://api.instagram.com/oauth/access_token', new URLSearchParams({
                client_id: process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID || '',
                client_secret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || '',
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.API_URL}/api/v1/social/instagram/callback`,
                code: code,
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            const { access_token, user_id } = tokenResponse.data;
            // Get user profile
            const profileResponse = await axios_1.default.get(`https://graph.instagram.com/${user_id}?fields=id,username,account_type&access_token=${access_token}`);
            const igProfile = profileResponse.data;
            const profile = {
                platform: 'instagram',
                id: igProfile.id,
                username: igProfile.username,
                displayName: igProfile.username,
                profileUrl: `https://instagram.com/${igProfile.username}`,
                accessToken: access_token,
            };
            await social_auth_service_1.default.linkSocialAccount(userId, profile);
            res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('instagram', 'success', { username: profile.username }));
        }
        catch (error) {
            logger_1.default.error('Instagram callback error:', error);
            res.redirect((0, social_auth_config_1.getMobileRedirectUrl)('instagram', 'error', { message: error.message }));
        }
    }
    /**
     * Initiate Twitter OAuth
     */
    async initiateTwitterAuth(req, res) {
        try {
            const userId = req.user?.userId;
            // Twitter uses OAuth 2.0 with PKCE
            const clientId = process.env.TWITTER_CLIENT_ID;
            const redirectUri = `${process.env.API_URL}/api/v1/social/twitter/callback`;
            const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
            const codeChallenge = 'challenge'; // In production, generate proper PKCE challenge
            const authUrl = `https://twitter.com/i/oauth2/authorize?` +
                `response_type=code` +
                `&client_id=${clientId}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=tweet.read%20users.read` +
                `&state=${state}` +
                `&code_challenge=${codeChallenge}` +
                `&code_challenge_method=plain`;
            res.json({ success: true, data: { authUrl } });
        }
        catch (error) {
            logger_1.default.error('Initiate Twitter auth error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Link social manually (for platforms without OAuth or as fallback)
     */
    async linkManually(req, res) {
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
            const socialLinks = await social_service_1.default.linkSocial(userId, platform, username);
            res.status(200).json({
                success: true,
                message: `${platform} account linked successfully`,
                data: { socialLinks },
            });
        }
        catch (error) {
            logger_1.default.error('Link manually error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to link account',
            });
        }
    }
    /**
     * Unlink social account
     */
    async unlinkSocial(req, res) {
        try {
            const userId = req.user?.userId;
            const { platform } = req.params;
            const socialLinks = await social_auth_service_1.default.unlinkSocialAccount(userId, platform);
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
                message: error.message || 'Failed to unlink account',
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
    /**
     * Verify social connection is still valid
     */
    async verifySocialConnection(req, res) {
        try {
            const userId = req.user?.userId;
            const { platform } = req.params;
            const isValid = await social_auth_service_1.default.verifySocialConnection(userId, platform);
            res.status(200).json({
                success: true,
                data: { platform, connected: isValid },
            });
        }
        catch (error) {
            logger_1.default.error('Verify social connection error:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.default = new SocialAuthController();
//# sourceMappingURL=social-auth.controller.js.map