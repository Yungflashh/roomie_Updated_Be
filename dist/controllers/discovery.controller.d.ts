import { Response } from 'express';
import { AuthRequest } from '../types';
declare class DiscoveryController {
    /**
     * Discover users with filters
     */
    discoverUsers(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get filter options for UI
     */
    getFilterOptions(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Search users by keyword
     */
    searchUsers(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: DiscoveryController;
export default _default;
//# sourceMappingURL=discovery.controller.d.ts.map