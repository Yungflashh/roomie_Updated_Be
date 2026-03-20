// src/services/social.service.ts
import { User } from '../models/User';
import logger from '../utils/logger';

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  username: string;
  url: string;
  connected: boolean;
  connectedAt?: Date;
}

class SocialService {
  /**
   * Add/Update social media link
   */
  async linkSocial(
    userId: string,
    platform: string,
    username: string
  ): Promise<SocialLink[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate URL based on platform
    const url = this.generateSocialUrl(platform, username);

    const socialLink: SocialLink = {
      platform: platform as SocialLink['platform'],
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
    const existingIndex = user.socialLinks.findIndex(
      (link: any) => link.platform === platform
    );

    if (existingIndex >= 0) {
      // Update existing
      user.socialLinks[existingIndex] = socialLink;
    } else {
      // Add new
      user.socialLinks.push(socialLink);
    }

    await user.save();
    logger.info(`User ${userId} linked ${platform} account: ${username}`);

    return user.socialLinks;
  }

  /**
   * Remove social media link
   */
  async unlinkSocial(userId: string, platform: string): Promise<SocialLink[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.socialLinks) {
      return [];
    }

    // Prevent unlinking last social account
    const connectedCount = user.socialLinks.filter((link: any) => link.connected).length;
    if (connectedCount <= 1) {
      throw new Error('Cannot unlink your last social media account. At least one is required for verification.');
    }

    // Prevent unlinking during pending verification
    if ((user as any).metadata?.verificationStatus === 'pending') {
      throw new Error('Cannot unlink social accounts while verification is under review.');
    }

    user.socialLinks = user.socialLinks.filter(
      (link: any) => link.platform !== platform
    );

    await user.save();
    logger.info(`User ${userId} unlinked ${platform} account`);

    return user.socialLinks;
  }

  /**
   * Get user's social links
   */
  async getSocialLinks(userId: string): Promise<SocialLink[]> {
    const user = await User.findById(userId).select('socialLinks');
    if (!user) {
      throw new Error('User not found');
    }

    return user.socialLinks || [];
  }

  /**
   * Generate social media URL from username
   */
  private generateSocialUrl(platform: string, username: string): string {
    const cleanUsername = username.replace('@', '');
    
    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${cleanUsername}`,
      facebook: `https://facebook.com/${cleanUsername}`,
      twitter: `https://twitter.com/${cleanUsername}`,
      linkedin: `https://linkedin.com/in/${cleanUsername}`,
      tiktok: `https://tiktok.com/@${cleanUsername}`,
    };

    return urls[platform] || '';
  }
}

export default new SocialService();