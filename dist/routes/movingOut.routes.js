"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/movingOut.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const movingOut_service_1 = __importDefault(require("../services/movingOut.service"));
const paystack_service_1 = __importDefault(require("../services/paystack.service"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// =======================
// LISTINGS
// =======================
/**
 * POST /moving-out/listings
 * Create a new moving out listing
 */
router.post('/listings', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const listing = await movingOut_service_1.default.createListing(userId, req.body);
        res.status(201).json({ success: true, data: listing });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * GET /moving-out/listings/search
 * Search active moving out listings
 */
router.get('/listings/search', async (req, res) => {
    try {
        const { city, state, minRent, maxRent, bedrooms, furnished, availableFrom, page, limit, } = req.query;
        const result = await movingOut_service_1.default.searchListings({
            city: city,
            state: state,
            minRent: minRent ? Number(minRent) : undefined,
            maxRent: maxRent ? Number(maxRent) : undefined,
            bedrooms: bedrooms ? Number(bedrooms) : undefined,
            furnished: furnished === 'true' ? true : furnished === 'false' ? false : undefined,
            availableFrom: availableFrom ? new Date(availableFrom) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /moving-out/listings/mine
 * Get my own listings
 */
router.get('/listings/mine', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const listings = await movingOut_service_1.default.listMyListings(userId);
        res.json({ success: true, data: listings });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /moving-out/listings/:listingId
 * Get a specific listing (increments view count for non-owners)
 */
router.get('/listings/:listingId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const listing = await movingOut_service_1.default.getListing(req.params.listingId, userId);
        res.json({ success: true, data: listing });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});
/**
 * PUT /moving-out/listings/:listingId
 * Update a listing (only the mover can edit)
 */
router.put('/listings/:listingId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const listing = await movingOut_service_1.default.updateListing(req.params.listingId, userId, req.body);
        res.json({ success: true, data: listing });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * DELETE /moving-out/listings/:listingId
 */
router.delete('/listings/:listingId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        await movingOut_service_1.default.deleteListing(req.params.listingId, userId);
        res.json({ success: true, message: 'Listing deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// =======================
// DEALS
// =======================
/**
 * POST /moving-out/deals
 * Create a deal (start a takeover inquiry)
 */
router.post('/deals', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { listingId } = req.body;
        if (!listingId) {
            res.status(400).json({ success: false, message: 'listingId required' });
            return;
        }
        const deal = await movingOut_service_1.default.createDeal(listingId, userId);
        res.status(201).json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * GET /moving-out/deals
 * Get my deals (as mover or seeker)
 */
router.get('/deals', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const role = req.query.role;
        const deals = await movingOut_service_1.default.getMyDeals(userId, role);
        res.json({ success: true, data: deals });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * GET /moving-out/deals/:dealId
 */
router.get('/deals/:dealId', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const deal = await movingOut_service_1.default.getDeal(req.params.dealId, userId);
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/accept
 * Mover accepts the inquiry
 */
router.post('/deals/:dealId/accept', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const deal = await movingOut_service_1.default.acceptInquiry(req.params.dealId, userId);
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/agree
 * Either party marks the deal as agreed (ready for payment)
 */
router.post('/deals/:dealId/agree', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const deal = await movingOut_service_1.default.markAgreed(req.params.dealId, userId);
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/pay
 * Seeker initiates payment
 */
router.post('/deals/:dealId/pay', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const result = await movingOut_service_1.default.initiatePayment(req.params.dealId, userId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/verify-payment
 * Manual payment verification (fallback if webhook delayed)
 */
router.post('/deals/:dealId/verify-payment', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const deal = await movingOut_service_1.default.getDeal(req.params.dealId, userId);
        if (!deal.paystackReference) {
            res.status(400).json({ success: false, message: 'No payment initialized for this deal' });
            return;
        }
        const updated = await movingOut_service_1.default.handlePaymentSuccess(deal.paystackReference);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/confirm-move-in
 * Seeker confirms move-in
 */
router.post('/deals/:dealId/confirm-move-in', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const deal = await movingOut_service_1.default.confirmMoveIn(req.params.dealId, userId);
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/bank-details
 * Mover sets their bank account for payout
 */
router.post('/deals/:dealId/bank-details', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { bankCode, bankName, accountNumber } = req.body;
        if (!bankCode || !accountNumber) {
            res.status(400).json({ success: false, message: 'bankCode and accountNumber required' });
            return;
        }
        const deal = await movingOut_service_1.default.setMoverBankDetails(req.params.dealId, userId, {
            bankCode,
            bankName,
            accountNumber,
        });
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/dispute
 * Open a dispute
 */
router.post('/deals/:dealId/dispute', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { reason } = req.body;
        if (!reason) {
            res.status(400).json({ success: false, message: 'reason required' });
            return;
        }
        const deal = await movingOut_service_1.default.openDispute(req.params.dealId, userId, reason);
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/deals/:dealId/cancel
 */
router.post('/deals/:dealId/cancel', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { reason } = req.body;
        const deal = await movingOut_service_1.default.cancelDeal(req.params.dealId, userId, reason || 'Cancelled by user');
        res.json({ success: true, data: deal });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
// =======================
// BANK HELPERS
// =======================
/**
 * GET /moving-out/banks
 * List Nigerian banks supported by Paystack
 */
router.get('/banks', async (_req, res) => {
    try {
        const banks = await paystack_service_1.default.listBanks('nigeria');
        res.json({ success: true, data: banks });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
/**
 * POST /moving-out/banks/resolve
 * Resolve an account number — returns the account holder name
 */
router.post('/banks/resolve', async (req, res) => {
    try {
        const { accountNumber, bankCode } = req.body;
        if (!accountNumber || !bankCode) {
            res.status(400).json({ success: false, message: 'accountNumber and bankCode required' });
            return;
        }
        const result = await paystack_service_1.default.resolveAccount(accountNumber, bankCode);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=movingOut.routes.js.map