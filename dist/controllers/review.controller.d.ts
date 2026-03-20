import { Response } from 'express';
import { AuthRequest } from '../types';
declare class ReviewController {
    create(req: AuthRequest, res: Response): Promise<void>;
    getUserReviews(req: AuthRequest, res: Response): Promise<void>;
    getPropertyReviews(req: AuthRequest, res: Response): Promise<void>;
    getPendingReviews(req: AuthRequest, res: Response): Promise<void>;
    toggleVisibility(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: ReviewController;
export default _default;
//# sourceMappingURL=review.controller.d.ts.map