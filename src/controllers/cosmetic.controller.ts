import { Response } from 'express';
import { AuthRequest } from '../types';
import cosmeticService from '../services/cosmetic.service';
import cacheService from '../services/cache.service';
import logger from '../utils/logger';

class CosmeticController {
  /**
   * GET /api/v1/cosmetics/shop
   * Get all available cosmetics in the shop
   */
  async getShopItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      const items = await cosmeticService.getShopItems(type as any);
      res.json({ success: true, data: items });
    } catch (error: any) {
      logger.error('Get shop items error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to load shop' });
    }
  }

  /**
   * GET /api/v1/cosmetics/inventory
   * Get user's owned cosmetics and equipped items
   */
  async getInventory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const inventory = await cosmeticService.getInventory(userId);
      res.json({ success: true, data: inventory });
    } catch (error: any) {
      logger.error('Get inventory error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to load inventory' });
    }
  }

  /**
   * POST /api/v1/cosmetics/purchase
   * Purchase a cosmetic item
   */
  async purchase(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { cosmeticId } = req.body;

      if (!cosmeticId) {
        res.status(400).json({ success: false, message: 'Cosmetic ID is required' });
        return;
      }

      const result = await cosmeticService.purchase(userId, cosmeticId);
      await cacheService.onPointsChange(userId);

      res.json({
        success: true,
        message: `Purchased ${result.cosmetic.name}!`,
        data: { cosmetic: result.cosmetic, newBalance: result.newBalance },
      });
    } catch (error: any) {
      logger.error('Purchase cosmetic error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to purchase' });
    }
  }

  /**
   * POST /api/v1/cosmetics/equip
   * Equip a cosmetic item
   */
  async equip(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { cosmeticId } = req.body;

      if (!cosmeticId) {
        res.status(400).json({ success: false, message: 'Cosmetic ID is required' });
        return;
      }

      await cosmeticService.equip(userId, cosmeticId);
      res.json({ success: true, message: 'Cosmetic equipped!' });
    } catch (error: any) {
      logger.error('Equip cosmetic error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to equip' });
    }
  }

  /**
   * POST /api/v1/cosmetics/unequip
   * Unequip a cosmetic slot
   */
  async unequip(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { type } = req.body;

      if (!type) {
        res.status(400).json({ success: false, message: 'Cosmetic type is required' });
        return;
      }

      await cosmeticService.unequip(userId, type);
      res.json({ success: true, message: 'Cosmetic unequipped' });
    } catch (error: any) {
      logger.error('Unequip cosmetic error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to unequip' });
    }
  }

  /**
   * POST /api/v1/cosmetics/seed
   * Seed default cosmetics (admin/dev endpoint)
   */
  async seed(req: AuthRequest, res: Response): Promise<void> {
    try {
      const count = await cosmeticService.seedDefaults();
      res.json({ success: true, message: `Seeded ${count} cosmetics`, data: { count } });
    } catch (error: any) {
      logger.error('Seed cosmetics error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to seed' });
    }
  }
}

export default new CosmeticController();
