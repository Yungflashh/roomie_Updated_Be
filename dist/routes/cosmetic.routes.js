"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cosmetic_controller_1 = __importDefault(require("../controllers/cosmetic.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/shop', cosmetic_controller_1.default.getShopItems);
router.get('/inventory', cosmetic_controller_1.default.getInventory);
router.post('/purchase', cosmetic_controller_1.default.purchase);
router.post('/equip', cosmetic_controller_1.default.equip);
router.post('/unequip', cosmetic_controller_1.default.unequip);
router.post('/seed', cosmetic_controller_1.default.seed);
exports.default = router;
//# sourceMappingURL=cosmetic.routes.js.map