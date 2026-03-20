"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/groupAgreement.routes.ts
const express_1 = require("express");
const groupAgreement_controller_1 = __importDefault(require("../controllers/groupAgreement.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/group-agreements/:groupId
 * @desc    Get or create agreement for a group
 * @access  Private
 */
router.post('/:groupId', groupAgreement_controller_1.default.getOrCreateAgreement);
/**
 * @route   GET /api/v1/group-agreements/:groupId
 * @desc    Get agreement by group ID
 * @access  Private
 */
router.get('/:groupId', groupAgreement_controller_1.default.getAgreement);
/**
 * @route   PUT /api/v1/group-agreements/:agreementId/sign
 * @desc    Sign a group agreement
 * @access  Private
 */
router.put('/:agreementId/sign', groupAgreement_controller_1.default.signAgreement);
exports.default = router;
//# sourceMappingURL=groupAgreement.routes.js.map