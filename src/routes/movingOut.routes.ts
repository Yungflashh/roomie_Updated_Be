// src/routes/movingOut.routes.ts
import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import movingOutService from '../services/movingOut.service';
import paystackService from '../services/paystack.service';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =======================
// LISTINGS
// =======================

/**
 * POST /moving-out/listings
 * Create a new moving out listing
 */
router.post('/listings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const listing = await movingOutService.createListing(userId, req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /moving-out/listings/search
 * Search active moving out listings
 */
router.get('/listings/search', async (req: AuthRequest, res: Response) => {
  try {
    const {
      city,
      state,
      minRent,
      maxRent,
      bedrooms,
      furnished,
      availableFrom,
      page,
      limit,
    } = req.query;

    const result = await movingOutService.searchListings({
      city: city as string,
      state: state as string,
      minRent: minRent ? Number(minRent) : undefined,
      maxRent: maxRent ? Number(maxRent) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      furnished: furnished === 'true' ? true : furnished === 'false' ? false : undefined,
      availableFrom: availableFrom ? new Date(availableFrom as string) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /moving-out/listings/mine
 * Get my own listings
 */
router.get('/listings/mine', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const listings = await movingOutService.listMyListings(userId);
    res.json({ success: true, data: listings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /moving-out/listings/:listingId
 * Get a specific listing (increments view count for non-owners)
 */
router.get('/listings/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const listing = await movingOutService.getListing(req.params.listingId, userId);
    res.json({ success: true, data: listing });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * PUT /moving-out/listings/:listingId
 * Update a listing (only the mover can edit)
 */
router.put('/listings/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const listing = await movingOutService.updateListing(req.params.listingId, userId, req.body);
    res.json({ success: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /moving-out/listings/:listingId
 */
router.delete('/listings/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    await movingOutService.deleteListing(req.params.listingId, userId);
    res.json({ success: true, message: 'Listing deleted' });
  } catch (error: any) {
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
router.post('/deals', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const { listingId } = req.body;
    if (!listingId) {
      res.status(400).json({ success: false, message: 'listingId required' });
      return;
    }
    const deal = await movingOutService.createDeal(listingId, userId);
    res.status(201).json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /moving-out/deals
 * Get my deals (as mover or seeker)
 */
router.get('/deals', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const role = req.query.role as 'mover' | 'seeker' | undefined;
    const deals = await movingOutService.getMyDeals(userId, role);
    res.json({ success: true, data: deals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /moving-out/deals/:dealId
 */
router.get('/deals/:dealId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const deal = await movingOutService.getDeal(req.params.dealId, userId);
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/accept
 * Mover accepts the inquiry
 */
router.post('/deals/:dealId/accept', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const deal = await movingOutService.acceptInquiry(req.params.dealId, userId);
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/agree
 * Either party marks the deal as agreed (ready for payment)
 */
router.post('/deals/:dealId/agree', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const deal = await movingOutService.markAgreed(req.params.dealId, userId);
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/pay
 * Seeker initiates payment
 */
router.post('/deals/:dealId/pay', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const result = await movingOutService.initiatePayment(req.params.dealId, userId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/verify-payment
 * Manual payment verification (fallback if webhook delayed)
 */
router.post('/deals/:dealId/verify-payment', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const deal = await movingOutService.getDeal(req.params.dealId, userId);
    if (!deal.paystackReference) {
      res.status(400).json({ success: false, message: 'No payment initialized for this deal' });
      return;
    }
    const updated = await movingOutService.handlePaymentSuccess(deal.paystackReference);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/confirm-move-in
 * Seeker confirms move-in
 */
router.post('/deals/:dealId/confirm-move-in', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const deal = await movingOutService.confirmMoveIn(req.params.dealId, userId);
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/bank-details
 * Mover sets their bank account for payout
 */
router.post('/deals/:dealId/bank-details', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const { bankCode, bankName, accountNumber } = req.body;
    if (!bankCode || !accountNumber) {
      res.status(400).json({ success: false, message: 'bankCode and accountNumber required' });
      return;
    }
    const deal = await movingOutService.setMoverBankDetails(req.params.dealId, userId, {
      bankCode,
      bankName,
      accountNumber,
    });
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/dispute
 * Open a dispute
 */
router.post('/deals/:dealId/dispute', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ success: false, message: 'reason required' });
      return;
    }
    const deal = await movingOutService.openDispute(req.params.dealId, userId, reason);
    res.json({ success: true, data: deal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/deals/:dealId/cancel
 */
router.post('/deals/:dealId/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId!;
    const { reason } = req.body;
    const deal = await movingOutService.cancelDeal(req.params.dealId, userId, reason || 'Cancelled by user');
    res.json({ success: true, data: deal });
  } catch (error: any) {
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
router.get('/banks', async (_req: AuthRequest, res: Response) => {
  try {
    const banks = await paystackService.listBanks('nigeria');
    res.json({ success: true, data: banks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /moving-out/banks/resolve
 * Resolve an account number — returns the account holder name
 */
router.post('/banks/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      res.status(400).json({ success: false, message: 'accountNumber and bankCode required' });
      return;
    }
    const result = await paystackService.resolveAccount(accountNumber, bankCode);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
