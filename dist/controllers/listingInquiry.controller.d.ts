import { Response } from 'express';
import { AuthRequest } from '../types';
declare class ListingInquiryController {
    create(req: AuthRequest, res: Response): Promise<void>;
    getInquiry(req: AuthRequest, res: Response): Promise<void>;
    getMyInquiries(req: AuthRequest, res: Response): Promise<void>;
    getMyListingInquiries(req: AuthRequest, res: Response): Promise<void>;
    requestViewing(req: AuthRequest, res: Response): Promise<void>;
    respondToViewing(req: AuthRequest, res: Response): Promise<void>;
    completeViewing(req: AuthRequest, res: Response): Promise<void>;
    cancelViewing(req: AuthRequest, res: Response): Promise<void>;
    makeOffer(req: AuthRequest, res: Response): Promise<void>;
    respondToOffer(req: AuthRequest, res: Response): Promise<void>;
    withdraw(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: ListingInquiryController;
export default _default;
//# sourceMappingURL=listingInquiry.controller.d.ts.map