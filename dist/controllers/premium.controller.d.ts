import { Response } from 'express';
import { AuthRequest } from '../types';
declare class PremiumController {
    /**
     * Get premium status and available plans
     */
    getStatus(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Subscribe to a plan via Paystack
     */
    subscribe(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Verify subscription payment
     */
    verifySubscription(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancel subscription
     */
    cancel(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Boost profile
     */
    boost(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get profile visitors
     */
    getVisitors(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Rewind last pass (premium only)
     */
    rewind(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Check swipe limit
     */
    checkSwipeLimit(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: PremiumController;
export default _default;
//# sourceMappingURL=premium.controller.d.ts.map