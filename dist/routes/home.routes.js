"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/home.routes.ts
const express_1 = require("express");
const home_controller_1 = __importDefault(require("../controllers/home.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/home/feed
 * @desc    Get aggregated home screen data (listings, roomies, matches, points) in one call
 * @access  Private
 * @query   city - optional city filter
 */
router.get('/feed', home_controller_1.default.getHomeFeed);
exports.default = router;
//# sourceMappingURL=home.routes.js.map