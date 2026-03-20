import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RoommateAgreementController {
    /**
     * Get or create agreement for a match
     */
    getOrCreateAgreement: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get agreement by match ID
     */
    getAgreement: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Sign agreement
     */
    signAgreement: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Get all my agreements
     */
    getMyAgreements: (req: AuthRequest, res: Response) => Promise<void>;
}
declare const _default: RoommateAgreementController;
export default _default;
//# sourceMappingURL=roommateAgreement.controller.d.ts.map