import { Response } from 'express';
import { AuthRequest } from '../types';
declare class PointsController {
    /**
     * Get user points statistics
     * GET /api/v1/points/stats
     */
    getPointsStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get transaction history
     * GET /api/v1/points/transactions
     */
    getTransactionHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Claim daily login bonus
     * POST /api/v1/points/daily-bonus
     */
    claimDailyBonus(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get points configuration
     * GET /api/v1/points/config
     */
    getPointsConfig(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check if user can afford action
     * GET /api/v1/points/check-affordability
     */
    checkAffordability(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Set or update points username
     * PUT /api/v1/points/username
     * Body: { username: string }
     */
    setPointsUsername(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check if points username is available
     * GET /api/v1/points/username/check?username=value
     */
    checkUsernameAvailability(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Search user by points username
     * GET /api/v1/points/username/search?username=value
     */
    searchByUsername(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Gift points to user by username
     * POST /api/v1/points/gift
     * Body: { username: string, amount: number, message: string }
     */
    giftPoints(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Request to purchase points (pending admin approval)
     * POST /api/v1/points/purchase
     * Body: { packageId: string, amount: number, pointsAmount: number }
     */
    requestPurchase(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify Paystack payment after user completes checkout
     * POST /api/v1/points/verify-payment
     */
    verifyPayment(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get user's purchase history
     * GET /api/v1/points/purchases
     */
    getPurchaseHistory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get referral stats and code
     * GET /api/v1/points/referral
     */
    getReferralStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Apply a referral code
     * POST /api/v1/points/referral/apply
     * Body: { code: string }
     */
    applyReferralCode(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: PointsController;
export default _default;
//# sourceMappingURL=points.controller.d.ts.map