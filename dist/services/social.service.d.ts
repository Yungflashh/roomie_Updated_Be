export interface SocialLink {
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
    username: string;
    url: string;
    connected: boolean;
    connectedAt?: Date;
}
declare class SocialService {
    /**
     * Add/Update social media link
     */
    linkSocial(userId: string, platform: string, username: string): Promise<SocialLink[]>;
    /**
     * Remove social media link
     */
    unlinkSocial(userId: string, platform: string): Promise<SocialLink[]>;
    /**
     * Get user's social links
     */
    getSocialLinks(userId: string): Promise<SocialLink[]>;
    /**
     * Generate social media URL from username
     */
    private generateSocialUrl;
}
declare const _default: SocialService;
export default _default;
//# sourceMappingURL=social.service.d.ts.map