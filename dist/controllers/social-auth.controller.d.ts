import { Request, Response } from 'express';
import { AuthRequest } from '../types';
declare class SocialAuthController {
    /**
     * Initiate Facebook OAuth
     */
    initiateFacebookAuth(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Facebook OAuth callback
     */
    facebookCallback(req: Request, res: Response): Promise<void>;
    /**
     * Initiate Instagram OAuth (via Facebook)
     */
    initiateInstagramAuth(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Instagram OAuth callback
     */
    instagramCallback(req: Request, res: Response): Promise<void>;
    /**
     * Initiate Twitter OAuth
     */
    initiateTwitterAuth(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Link social manually (for platforms without OAuth or as fallback)
     */
    linkManually(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Unlink social account
     */
    unlinkSocial(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get social links
     */
    getSocialLinks(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify social connection is still valid
     */
    verifySocialConnection(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: SocialAuthController;
export default _default;
//# sourceMappingURL=social-auth.controller.d.ts.map