import { Response } from 'express';
import { AuthRequest } from '../types';
declare class SocialController {
    /**
     * Link social media account
     */
    linkSocial(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Unlink social media account
     */
    unlinkSocial(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get social links
     */
    getSocialLinks(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: SocialController;
export default _default;
//# sourceMappingURL=social.controller.d.ts.map