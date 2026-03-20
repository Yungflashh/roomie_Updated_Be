import { Response } from 'express';
import { AuthRequest } from '../types';
declare class HomeController {
    /**
     * Get aggregated home feed data in a single request
     * GET /api/v1/home/feed
     */
    getHomeFeed(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: HomeController;
export default _default;
//# sourceMappingURL=home.controller.d.ts.map