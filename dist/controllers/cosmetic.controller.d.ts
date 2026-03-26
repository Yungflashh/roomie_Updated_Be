import { Response } from 'express';
import { AuthRequest } from '../types';
declare class CosmeticController {
    /**
     * GET /api/v1/cosmetics/shop
     * Get all available cosmetics in the shop
     */
    getShopItems(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/v1/cosmetics/inventory
     * Get user's owned cosmetics and equipped items
     */
    getInventory(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/v1/cosmetics/purchase
     * Purchase a cosmetic item
     */
    purchase(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/v1/cosmetics/equip
     * Equip a cosmetic item
     */
    equip(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/v1/cosmetics/unequip
     * Unequip a cosmetic slot
     */
    unequip(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/v1/cosmetics/seed
     * Seed default cosmetics (admin/dev endpoint)
     */
    seed(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: CosmeticController;
export default _default;
//# sourceMappingURL=cosmetic.controller.d.ts.map