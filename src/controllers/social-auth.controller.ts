// src/controllers/social-auth.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import socialAuthService, { SocialProfile } from '../services/social-auth.service';
import socialService from '../services/social.service';
import { getMobileRedirectUrl } from '../config/social-auth.config';
import logger from '../utils/logger';
import axios from 'axios';

class SocialAuthController {
  /**
   * Initiate Facebook OAuth
   */
  async initiateFacebookAuth(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error('Initiate Facebook auth error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Facebook OAuth callback
   */
  async facebookCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.redirect(getMobileRedirectUrl('facebook', 'error', { message: 'Missing code or state' }));
        return;
      }

      // Decode state to get userId
      const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

      // Exchange code for access token
      const tokenResponse = await axios.get(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${process.env.FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(`${process.env.API_URL}/api/v1/social/facebook/callback`)}` +
        `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
        `&code=${code}`
      );

      const accessToken = tokenResponse.data.access_token;

      // Get user profile
      const profileResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture,link&access_token=${accessToken}`
      );

      const fbProfile = profileResponse.data;

      const profile: SocialProfile = {
        platform: 'facebook',
        id: fbProfile.id,
        username: fbProfile.name.replace(/\s+/g, '.').toLowerCase(),
        displayName: fbProfile.name,
        profileUrl: fbProfile.link || `https://facebook.com/${fbProfile.id}`,
        profilePhoto: fbProfile.picture?.data?.url,
        accessToken,
      };

      await socialAuthService.linkSocialAccount(userId, profile);

      // Redirect to mobile app
      res.redirect(getMobileRedirectUrl('facebook', 'success', { username: profile.username }));
    } catch (error: any) {
      logger.error('Facebook callback error:', error);
      res.redirect(getMobileRedirectUrl('facebook', 'error', { message: error.message }));
    }
  }

  /**
   * Initiate Instagram OAuth (via Facebook)
   */
  async initiateInstagramAuth(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error('Initiate Instagram auth error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Instagram OAuth callback
   */
  async instagramCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        res.redirect(getMobileRedirectUrl('instagram', 'error', { message: 'Missing code or state' }));
        return;
      }

      const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString());

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://api.instagram.com/oauth/access_token',
        new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_APP_ID || '',
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || '',
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.API_URL}/api/v1/social/instagram/callback`,
          code: code as string,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, user_id } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get(
        `https://graph.instagram.com/${user_id}?fields=id,username,account_type&access_token=${access_token}`
      );

      const igProfile = profileResponse.data;

      const profile: SocialProfile = {
        platform: 'instagram',
        id: igProfile.id,
        username: igProfile.username,
        displayName: igProfile.username,
        profileUrl: `https://instagram.com/${igProfile.username}`,
        accessToken: access_token,
      };

      await socialAuthService.linkSocialAccount(userId, profile);

      res.redirect(getMobileRedirectUrl('instagram', 'success', { username: profile.username }));
    } catch (error: any) {
      logger.error('Instagram callback error:', error);
      res.redirect(getMobileRedirectUrl('instagram', 'error', { message: error.message }));
    }
  }

  /**
   * Initiate Twitter OAuth
   */
  async initiateTwitterAuth(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error: any) {
      logger.error('Initiate Twitter auth error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Link social manually (for platforms without OAuth or as fallback)
   */
  async linkManually(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { platform, username } = req.body;

      if (!platform || !username) {
        res.status(400).json({
          success: false,
          message: 'Platform and username are required',
        });
        return;
      }

      const socialLinks = await socialService.linkSocial(userId, platform, username);

      res.status(200).json({
        success: true,
        message: `${platform} account linked successfully`,
        data: { socialLinks },
      });
    } catch (error: any) {
      logger.error('Link manually error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to link account',
      });
    }
  }

  /**
   * Unlink social account
   */
  async unlinkSocial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { platform } = req.params;

      const socialLinks = await socialAuthService.unlinkSocialAccount(userId, platform);

      res.status(200).json({
        success: true,
        message: `${platform} account unlinked successfully`,
        data: { socialLinks },
      });
    } catch (error: any) {
      logger.error('Unlink social error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unlink account',
      });
    }
  }

  /**
   * Get social links
   */
  async getSocialLinks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;

      const socialLinks = await socialService.getSocialLinks(userId);

      res.status(200).json({
        success: true,
        data: { socialLinks },
      });
    } catch (error: any) {
      logger.error('Get social links error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get social links',
      });
    }
  }

  /**
   * Verify social connection is still valid
   */
  async verifySocialConnection(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { platform } = req.params;

      const isValid = await socialAuthService.verifySocialConnection(userId, platform);

      res.status(200).json({
        success: true,
        data: { platform, connected: isValid },
      });
    } catch (error: any) {
      logger.error('Verify social connection error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new SocialAuthController();