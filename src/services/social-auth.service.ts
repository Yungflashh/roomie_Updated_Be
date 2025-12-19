// src/services/social-auth.service.ts
import { User, ISocialLink } from '../models/User';
import logger from '../utils/logger';
import axios from 'axios';

export interface SocialProfile {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  id: string;
  username: string;
  displayName: string;
  profileUrl: string;
  profilePhoto?: string;
  accessToken: string;
  refreshToken?: string;
}

class SocialAuthService {
  /**
   * Link social account after OAuth callback
   */
  async linkSocialAccount(userId: string, profile: SocialProfile): Promise<ISocialLink[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const socialLink: ISocialLink = {
      platform: profile.platform,
      username: profile.username,
      url: profile.profileUrl,
      connected: true,
      connectedAt: new Date(),
      profileId: profile.id,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      profilePhoto: profile.profilePhoto,
    };

    // Initialize socialLinks array if not exists
    if (!user.socialLinks) {
      user.socialLinks = [];
    }

    // Check if platform already linked
    const existingIndex = user.socialLinks.findIndex(
      (link) => link.platform === profile.platform
    );

    if (existingIndex >= 0) {
      user.socialLinks[existingIndex] = socialLink;
    } else {
      user.socialLinks.push(socialLink);
    }

    await user.save();
    logger.info(`User ${userId} linked ${profile.platform} account: ${profile.username}`);

    // Return without sensitive tokens
    return user.socialLinks.map(link => ({
      platform: link.platform,
      username: link.username,
      url: link.url,
      connected: link.connected,
      connectedAt: link.connectedAt,
      profilePhoto: link.profilePhoto,
    })) as ISocialLink[];
  }

  /**
   * Unlink social account
   */
  async unlinkSocialAccount(userId: string, platform: string): Promise<ISocialLink[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.socialLinks) {
      return [];
    }

    // Find the link to revoke access
    const link = user.socialLinks.find(l => l.platform === platform);
    if (link?.accessToken) {
      await this.revokeAccess(platform, link.accessToken);
    }

    user.socialLinks = user.socialLinks.filter(
      (link) => link.platform !== platform
    );

    await user.save();
    logger.info(`User ${userId} unlinked ${platform} account`);

    return user.socialLinks;
  }

  /**
   * Revoke access token (platform specific)
   */
  private async revokeAccess(platform: string, accessToken: string): Promise<void> {
    try {
      switch (platform) {
        case 'facebook':
        case 'instagram':
          await axios.delete(
            `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
          );
          break;
        // Add other platforms as needed
      }
    } catch (error) {
      logger.error(`Failed to revoke ${platform} access:`, error);
      // Don't throw - we still want to unlink locally
    }
  }

  /**
   * Get Instagram profile using Facebook Graph API
   */
  async getInstagramProfile(accessToken: string): Promise<SocialProfile | null> {
    try {
      // Get Instagram account linked to Facebook
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
      );

      if (response.data.data?.[0]?.instagram_business_account) {
        const igAccountId = response.data.data[0].instagram_business_account.id;
        
        const igProfile = await axios.get(
          `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,profile_picture_url,name&access_token=${accessToken}`
        );

        return {
          platform: 'instagram',
          id: igAccountId,
          username: igProfile.data.username,
          displayName: igProfile.data.name,
          profileUrl: `https://instagram.com/${igProfile.data.username}`,
          profilePhoto: igProfile.data.profile_picture_url,
          accessToken,
        };
      }

      return null;
    } catch (error) {
      logger.error('Get Instagram profile error:', error);
      return null;
    }
  }

  /**
   * Verify and refresh social tokens
   */
  async verifySocialConnection(userId: string, platform: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user?.socialLinks) return false;

    const link = user.socialLinks.find(l => l.platform === platform);
    if (!link?.accessToken) return false;

    try {
      switch (platform) {
        case 'facebook':
          const fbResponse = await axios.get(
            `https://graph.facebook.com/me?access_token=${link.accessToken}`
          );
          return !!fbResponse.data.id;
        
        case 'instagram':
          // Instagram uses Facebook's token
          return true;
        
        default:
          return true;
      }
    } catch (error) {
      // Token expired or revoked
      return false;
    }
  }
}

export default new SocialAuthService();