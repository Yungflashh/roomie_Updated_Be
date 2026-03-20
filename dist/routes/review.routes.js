"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Create review
router.post('/', review_controller_1.default.create);
// Pending reviews for me
router.get('/pending', review_controller_1.default.getPendingReviews);
// Reviews for a user
router.get('/user/:userId', review_controller_1.default.getUserReviews);
// Reviews for a property
router.get('/property/:propertyId', review_controller_1.default.getPropertyReviews);
exports.default = router;
//# sourceMappingURL=review.routes.js.map