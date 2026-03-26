import { Router } from 'express';
import cosmeticController from '../controllers/cosmetic.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/shop', cosmeticController.getShopItems);
router.get('/inventory', cosmeticController.getInventory);
router.post('/purchase', cosmeticController.purchase);
router.post('/equip', cosmeticController.equip);
router.post('/unequip', cosmeticController.unequip);
router.post('/seed', cosmeticController.seed);

export default router;
