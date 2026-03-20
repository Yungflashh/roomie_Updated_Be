import { Response } from 'express';
import { AuthRequest } from '../types';
declare class GroupAgreementController {
    getOrCreateAgreement: (req: AuthRequest, res: Response) => Promise<void>;
    getAgreement: (req: AuthRequest, res: Response) => Promise<void>;
    signAgreement: (req: AuthRequest, res: Response) => Promise<void>;
}
declare const _default: GroupAgreementController;
export default _default;
//# sourceMappingURL=groupAgreement.controller.d.ts.map