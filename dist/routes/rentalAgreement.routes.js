"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rentalAgreement_controller_1 = __importDefault(require("../controllers/rentalAgreement.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get my agreements
router.get('/', rentalAgreement_controller_1.default.getMyAgreements);
// Create agreement from inquiry
router.post('/inquiry/:inquiryId', rentalAgreement_controller_1.default.create);
// Get agreement by inquiry
router.get('/inquiry/:inquiryId', rentalAgreement_controller_1.default.getByInquiry);
// Get agreement by ID
router.get('/:agreementId', rentalAgreement_controller_1.default.getAgreement);
// Update terms
router.put('/:agreementId/terms', rentalAgreement_controller_1.default.updateTerms);
// Sign agreement
router.put('/:agreementId/sign', rentalAgreement_controller_1.default.sign);
// Terminate agreement
router.put('/:agreementId/terminate', rentalAgreement_controller_1.default.terminate);
exports.default = router;
//# sourceMappingURL=rentalAgreement.routes.js.map