"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listingInquiry_controller_1 = __importDefault(require("../controllers/listingInquiry.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Create inquiry
router.post('/', listingInquiry_controller_1.default.create);
// My inquiries (as seeker)
router.get('/my-inquiries', listingInquiry_controller_1.default.getMyInquiries);
// Inquiries on my listings (as lister)
router.get('/my-listings', listingInquiry_controller_1.default.getMyListingInquiries);
// Get single inquiry
router.get('/:inquiryId', listingInquiry_controller_1.default.getInquiry);
// Viewing flow
router.post('/:inquiryId/viewing/request', listingInquiry_controller_1.default.requestViewing);
router.put('/:inquiryId/viewing/respond', listingInquiry_controller_1.default.respondToViewing);
router.put('/:inquiryId/viewing/complete', listingInquiry_controller_1.default.completeViewing);
router.put('/:inquiryId/viewing/cancel', listingInquiry_controller_1.default.cancelViewing);
// Offer flow
router.post('/:inquiryId/offer', listingInquiry_controller_1.default.makeOffer);
router.put('/:inquiryId/offer/respond', listingInquiry_controller_1.default.respondToOffer);
// Withdraw
router.put('/:inquiryId/withdraw', listingInquiry_controller_1.default.withdraw);
exports.default = router;
//# sourceMappingURL=listingInquiry.routes.js.map