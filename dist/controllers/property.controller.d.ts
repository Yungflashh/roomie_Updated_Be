import { Response } from 'express';
import { AuthRequest } from '../types';
declare class PropertyController {
    createProperty(req: AuthRequest, res: Response): Promise<void>;
    getProperty(req: AuthRequest, res: Response): Promise<void>;
    updateProperty(req: AuthRequest, res: Response): Promise<void>;
    deleteProperty(req: AuthRequest, res: Response): Promise<void>;
    searchProperties(req: AuthRequest, res: Response): Promise<void>;
    getLandlordProperties(req: AuthRequest, res: Response): Promise<void>;
    likeProperty(req: AuthRequest, res: Response): Promise<void>;
    unlikeProperty(req: AuthRequest, res: Response): Promise<void>;
    getLikedProperties(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: PropertyController;
export default _default;
//# sourceMappingURL=property.controller.d.ts.map