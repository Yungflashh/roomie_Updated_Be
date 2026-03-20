"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const listingInquiry_service_1 = __importDefault(require("../services/listingInquiry.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class ListingInquiryController {
    async create(req, res) {
        try {
            const userId = req.user?.userId;
            const { listerId, propertyId } = req.body;
            if (!listerId || !propertyId) {
                res.status(400).json({ success: false, message: 'listerId and propertyId are required' });
                return;
            }
            const inquiry = await listingInquiry_service_1.default.createInquiry(userId, listerId, propertyId);
            res.status(201).json({ success: true, data: inquiry });
        }
        catch (error) {
            logger_1.default.error('Create inquiry error:', error);
            res.status(error.message.includes('yourself') ? 400 : 500).json({ success: false, message: error.message });
        }
    }
    async getInquiry(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.getInquiry(req.params.inquiryId, req.user?.userId);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            const code = error.message.includes('not found') ? 404 : error.message.includes('Unauthorized') ? 403 : 500;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    async getMyInquiries(req, res) {
        try {
            const inquiries = await listingInquiry_service_1.default.getSeekerInquiries(req.user?.userId);
            res.json({ success: true, data: inquiries });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getMyListingInquiries(req, res) {
        try {
            const inquiries = await listingInquiry_service_1.default.getListerInquiries(req.user?.userId);
            res.json({ success: true, data: inquiries });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async requestViewing(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.requestViewing(req.params.inquiryId, req.user?.userId, req.body);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async respondToViewing(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.respondToViewing(req.params.inquiryId, req.user?.userId, req.body);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async completeViewing(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.completeViewing(req.params.inquiryId, req.user?.userId);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async cancelViewing(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.cancelViewing(req.params.inquiryId, req.user?.userId);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async makeOffer(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.makeOffer(req.params.inquiryId, req.user?.userId, req.body);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async respondToOffer(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.respondToOffer(req.params.inquiryId, req.user?.userId, req.body);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async withdraw(req, res) {
        try {
            const inquiry = await listingInquiry_service_1.default.withdrawInquiry(req.params.inquiryId, req.user?.userId);
            res.json({ success: true, data: inquiry });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.default = new ListingInquiryController();
//# sourceMappingURL=listingInquiry.controller.js.map