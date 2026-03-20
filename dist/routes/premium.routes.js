"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const premium_controller_1 = __importDefault(require("../controllers/premium.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get premium status + available plans
router.get('/status', premium_controller_1.default.getStatus);
// Subscribe to a plan
router.post('/subscribe', premium_controller_1.default.subscribe);
// Verify subscription payment
router.post('/verify', premium_controller_1.default.verifySubscription);
// Cancel subscription
router.post('/cancel', premium_controller_1.default.cancel);
// Boost profile (premium only)
router.post('/boost', premium_controller_1.default.boost);
// Get profile visitors (premium only)
router.get('/visitors', premium_controller_1.default.getVisitors);
// Rewind last pass (premium only)
router.post('/rewind', premium_controller_1.default.rewind);
// Check swipe limit
router.get('/swipe-limit', premium_controller_1.default.checkSwipeLimit);
exports.default = router;
//# sourceMappingURL=premium.routes.js.map