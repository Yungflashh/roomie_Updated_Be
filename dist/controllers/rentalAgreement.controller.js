"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rentalAgreement_service_1 = __importDefault(require("../services/rentalAgreement.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RentalAgreementController {
    async create(req, res) {
        try {
            const agreement = await rentalAgreement_service_1.default.createAgreement(req.params.inquiryId, req.user?.userId, req.body);
            res.status(201).json({ success: true, data: agreement });
        }
        catch (error) {
            logger_1.default.error('Create rental agreement error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getAgreement(req, res) {
        try {
            const agreement = await rentalAgreement_service_1.default.getAgreement(req.params.agreementId, req.user?.userId);
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            const code = error.message.includes('not found') ? 404 : error.message.includes('Unauthorized') ? 403 : 500;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    async getByInquiry(req, res) {
        try {
            const agreement = await rentalAgreement_service_1.default.getByInquiry(req.params.inquiryId);
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateTerms(req, res) {
        try {
            const agreement = await rentalAgreement_service_1.default.updateTerms(req.params.agreementId, req.user?.userId, req.body);
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async sign(req, res) {
        try {
            const { fullName } = req.body;
            if (!fullName) {
                res.status(400).json({ success: false, message: 'fullName is required' });
                return;
            }
            const agreement = await rentalAgreement_service_1.default.signAgreement(req.params.agreementId, req.user?.userId, fullName);
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getMyAgreements(req, res) {
        try {
            const agreements = await rentalAgreement_service_1.default.getUserAgreements(req.user?.userId);
            res.json({ success: true, data: agreements });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async terminate(req, res) {
        try {
            const agreement = await rentalAgreement_service_1.default.terminateAgreement(req.params.agreementId, req.user?.userId);
            res.json({ success: true, data: agreement });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.default = new RentalAgreementController();
//# sourceMappingURL=rentalAgreement.controller.js.map