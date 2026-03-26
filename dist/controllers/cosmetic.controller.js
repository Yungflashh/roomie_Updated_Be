"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cosmetic_service_1 = __importDefault(require("../services/cosmetic.service"));
const cache_service_1 = __importDefault(require("../services/cache.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class CosmeticController {
    /**
     * GET /api/v1/cosmetics/shop
     * Get all available cosmetics in the shop
     */
    async getShopItems(req, res) {
        try {
            const { type } = req.query;
            const items = await cosmetic_service_1.default.getShopItems(type);
            res.json({ success: true, data: items });
        }
        catch (error) {
            logger_1.default.error('Get shop items error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to load shop' });
        }
    }
    /**
     * GET /api/v1/cosmetics/inventory
     * Get user's owned cosmetics and equipped items
     */
    async getInventory(req, res) {
        try {
            const userId = req.user?.userId;
            const inventory = await cosmetic_service_1.default.getInventory(userId);
            res.json({ success: true, data: inventory });
        }
        catch (error) {
            logger_1.default.error('Get inventory error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to load inventory' });
        }
    }
    /**
     * POST /api/v1/cosmetics/purchase
     * Purchase a cosmetic item
     */
    async purchase(req, res) {
        try {
            const userId = req.user?.userId;
            const { cosmeticId } = req.body;
            if (!cosmeticId) {
                res.status(400).json({ success: false, message: 'Cosmetic ID is required' });
                return;
            }
            const result = await cosmetic_service_1.default.purchase(userId, cosmeticId);
            await cache_service_1.default.onPointsChange(userId);
            res.json({
                success: true,
                message: `Purchased ${result.cosmetic.name}!`,
                data: { cosmetic: result.cosmetic, newBalance: result.newBalance },
            });
        }
        catch (error) {
            logger_1.default.error('Purchase cosmetic error:', error);
            res.status(400).json({ success: false, message: error.message || 'Failed to purchase' });
        }
    }
    /**
     * POST /api/v1/cosmetics/equip
     * Equip a cosmetic item
     */
    async equip(req, res) {
        try {
            const userId = req.user?.userId;
            const { cosmeticId } = req.body;
            if (!cosmeticId) {
                res.status(400).json({ success: false, message: 'Cosmetic ID is required' });
                return;
            }
            await cosmetic_service_1.default.equip(userId, cosmeticId);
            res.json({ success: true, message: 'Cosmetic equipped!' });
        }
        catch (error) {
            logger_1.default.error('Equip cosmetic error:', error);
            res.status(400).json({ success: false, message: error.message || 'Failed to equip' });
        }
    }
    /**
     * POST /api/v1/cosmetics/unequip
     * Unequip a cosmetic slot
     */
    async unequip(req, res) {
        try {
            const userId = req.user?.userId;
            const { type } = req.body;
            if (!type) {
                res.status(400).json({ success: false, message: 'Cosmetic type is required' });
                return;
            }
            await cosmetic_service_1.default.unequip(userId, type);
            res.json({ success: true, message: 'Cosmetic unequipped' });
        }
        catch (error) {
            logger_1.default.error('Unequip cosmetic error:', error);
            res.status(400).json({ success: false, message: error.message || 'Failed to unequip' });
        }
    }
    /**
     * POST /api/v1/cosmetics/seed
     * Seed default cosmetics (admin/dev endpoint)
     */
    async seed(req, res) {
        try {
            const count = await cosmetic_service_1.default.seedDefaults();
            res.json({ success: true, message: `Seeded ${count} cosmetics`, data: { count } });
        }
        catch (error) {
            logger_1.default.error('Seed cosmetics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to seed' });
        }
    }
}
exports.default = new CosmeticController();
//# sourceMappingURL=cosmetic.controller.js.map