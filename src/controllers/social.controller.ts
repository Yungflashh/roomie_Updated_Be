// src/controllers/social.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import socialService from '../services/social.service';
import logger from '../utils/logger';

class SocialController {
  /**
   * Link social media account
   */
  async linkSocial(req: AuthRequest, res: Response): Promise<void> {
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

      const validPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
      if (!validPlatforms.includes(platform)) {
        res.status(400).json({
          success: false,
          message: 'Invalid platform',
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
      logger.error('Link social error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to link social account',
      });
    }
  }

  /**
   * Unlink social media account
   */
  async unlinkSocial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { platform } = req.params;

      const socialLinks = await socialService.unlinkSocial(userId, platform);

      res.status(200).json({
        success: true,
        message: `${platform} account unlinked successfully`,
        data: { socialLinks },
      });
    } catch (error: any) {
      logger.error('Unlink social error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unlink social account',
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
}

export default new SocialController();