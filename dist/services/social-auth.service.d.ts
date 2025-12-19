import { ISocialLink } from '../models/User';
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
declare class SocialAuthService {
    /**
     * Link social account after OAuth callback
     */
    linkSocialAccount(userId: string, profile: SocialProfile): Promise<ISocialLink[]>;
    /**
     * Unlink social account
     */
    unlinkSocialAccount(userId: string, platform: string): Promise<ISocialLink[]>;
    /**
     * Revoke access token (platform specific)
     */
    private revokeAccess;
    /**
     * Get Instagram profile using Facebook Graph API
     */
    getInstagramProfile(accessToken: string): Promise<SocialProfile | null>;
    /**
     * Verify and refresh social tokens
     */
    verifySocialConnection(userId: string, platform: string): Promise<boolean>;
}
declare const _default: SocialAuthService;
export default _default;
//# sourceMappingURL=social-auth.service.d.ts.map