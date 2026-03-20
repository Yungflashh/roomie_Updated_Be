"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roommateAgreement.routes.ts
const express_1 = require("express");
const roommateAgreement_controller_1 = __importDefault(require("../controllers/roommateAgreement.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/roommate-agreements
 * @desc    Get all my agreements
 * @access  Private
 */
router.get('/', roommateAgreement_controller_1.default.getMyAgreements);
/**
 * @route   POST /api/v1/roommate-agreements/:matchId
 * @desc    Get or create agreement for a match
 * @access  Private
 */
router.post('/:matchId', roommateAgreement_controller_1.default.getOrCreateAgreement);
/**
 * @route   GET /api/v1/roommate-agreements/:matchId
 * @desc    Get agreement by match ID
 * @access  Private
 */
router.get('/:matchId', roommateAgreement_controller_1.default.getAgreement);
/**
 * @route   PUT /api/v1/roommate-agreements/:agreementId/sign
 * @desc    Sign an agreement
 * @access  Private
 */
router.put('/:agreementId/sign', roommateAgreement_controller_1.default.signAgreement);
exports.default = router;
//# sourceMappingURL=roommateAgreement.routes.js.map