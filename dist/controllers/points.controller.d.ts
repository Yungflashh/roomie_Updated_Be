import { Response } from 'express';
import { AuthRequest } from '../types';
declare class PointsController {
    /**
     * Get user points statistics
     */
    getPointsStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get transaction history
     */
    getTransactionHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Claim daily login bonus
     */
    claimDailyBonus(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get points configuration
     */
    getPointsConfig(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check if user can afford action
     */
    checkAffordability(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: PointsController;
export default _default;
//# sourceMappingURL=points.controller.d.ts.map