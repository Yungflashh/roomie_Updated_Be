import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RentalAgreementController {
    create(req: AuthRequest, res: Response): Promise<void>;
    getAgreement(req: AuthRequest, res: Response): Promise<void>;
    getByInquiry(req: AuthRequest, res: Response): Promise<void>;
    updateTerms(req: AuthRequest, res: Response): Promise<void>;
    sign(req: AuthRequest, res: Response): Promise<void>;
    getMyAgreements(req: AuthRequest, res: Response): Promise<void>;
    terminate(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: RentalAgreementController;
export default _default;
//# sourceMappingURL=rentalAgreement.controller.d.ts.map