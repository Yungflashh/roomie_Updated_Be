"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/movingOut.service.ts
const nanoid_1 = require("nanoid");
const models_1 = require("../models");
const paystack_service_1 = __importDefault(require("./paystack.service"));
const notification_service_1 = __importDefault(require("./notification.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const PLATFORM_FEE_PERCENT = 10; // 10% platform fee on each successful deal
const DISPUTE_WINDOW_HOURS = 48;
class MovingOutService {
    // =======================
    // LISTING MANAGEMENT
    // =======================
    async createListing(moverId, data) {
        // Basic validation
        if (!data.title || !data.monthlyRent || !data.referralFee || !data.moveOutDate) {
            throw new Error('Missing required fields: title, monthlyRent, referralFee, moveOutDate');
        }
        // Sanity check: referralFee shouldn't exceed annual rent
        if (data.annualRent && data.referralFee > data.annualRent) {
            throw new Error('Referral fee cannot exceed annual rent');
        }
        const listing = await models_1.MovingOutListing.create({
            ...data,
            mover: moverId,
            status: 'pending_review',
        });
        logger_1.default.info(`Moving out listing created by user ${moverId}: ${listing._id}`);
        return listing;
    }
    async updateListing(listingId, moverId, data) {
        const listing = await models_1.MovingOutListing.findOne({ _id: listingId, mover: moverId });
        if (!listing)
            throw new Error('Listing not found or unauthorized');
        if (listing.status === 'in_deal' || listing.status === 'completed') {
            throw new Error('Cannot edit a listing that has an active deal or is completed');
        }
        Object.assign(listing, data);
        // Re-enter pending review if was active
        if (listing.status === 'active') {
            listing.status = 'pending_review';
        }
        await listing.save();
        return listing;
    }
    async deleteListing(listingId, moverId) {
        const listing = await models_1.MovingOutListing.findOne({ _id: listingId, mover: moverId });
        if (!listing)
            throw new Error('Listing not found or unauthorized');
        if (listing.status === 'in_deal') {
            throw new Error('Cannot delete a listing with an active deal. Cancel the deal first.');
        }
        await listing.deleteOne();
    }
    async getListing(listingId, viewerId) {
        const listing = await models_1.MovingOutListing.findById(listingId).populate('mover', 'firstName lastName profilePhoto verified bio occupation');
        if (!listing)
            throw new Error('Listing not found');
        // Only increment views if viewer is not the owner
        if (viewerId && listing.mover && listing.mover._id.toString() !== viewerId) {
            listing.views += 1;
            await listing.save();
        }
        return listing;
    }
    async listMyListings(moverId) {
        return models_1.MovingOutListing.find({ mover: moverId }).sort({ createdAt: -1 });
    }
    async searchListings(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const query = { status: 'active' };
        if (filters.city)
            query['location.city'] = { $regex: filters.city, $options: 'i' };
        if (filters.state)
            query['location.state'] = { $regex: filters.state, $options: 'i' };
        if (filters.minRent !== undefined || filters.maxRent !== undefined) {
            query.monthlyRent = {};
            if (filters.minRent !== undefined)
                query.monthlyRent.$gte = filters.minRent;
            if (filters.maxRent !== undefined)
                query.monthlyRent.$lte = filters.maxRent;
        }
        if (filters.bedrooms !== undefined)
            query.bedrooms = filters.bedrooms;
        if (filters.furnished !== undefined)
            query.furnished = filters.furnished;
        if (filters.availableFrom)
            query.availableFrom = { $lte: filters.availableFrom };
        const [listings, total] = await Promise.all([
            models_1.MovingOutListing.find(query)
                .populate('mover', 'firstName lastName profilePhoto verified')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            models_1.MovingOutListing.countDocuments(query),
        ]);
        return {
            listings,
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }
    // =======================
    // DEAL FLOW
    // =======================
    async createDeal(listingId, seekerId) {
        const listing = await models_1.MovingOutListing.findById(listingId);
        if (!listing)
            throw new Error('Listing not found');
        if (listing.status !== 'active')
            throw new Error('This listing is no longer available');
        if (listing.mover.toString() === seekerId)
            throw new Error('You cannot start a deal on your own listing');
        // Check if there's already an open deal from this seeker on this listing
        const existing = await models_1.MoveOutDeal.findOne({
            listing: listingId,
            seeker: seekerId,
            status: { $in: ['inquiry_sent', 'inspection_scheduled', 'inspection_done', 'agreed', 'payment_pending', 'payment_escrowed'] },
        });
        if (existing)
            return existing;
        const platformFeeAmount = Math.round((listing.referralFee * PLATFORM_FEE_PERCENT) / 100);
        const netToMover = listing.referralFee - platformFeeAmount;
        const deal = await models_1.MoveOutDeal.create({
            listing: listingId,
            mover: listing.mover,
            seeker: seekerId,
            status: 'inquiry_sent',
            referralFeeAmount: listing.referralFee,
            platformFeePercent: PLATFORM_FEE_PERCENT,
            platformFeeAmount,
            netToMover,
            timeline: [
                {
                    event: 'inquiry_sent',
                    actor: seekerId,
                    timestamp: new Date(),
                    note: 'Seeker initiated interest in this listing',
                },
            ],
        });
        // Increment inquiry count on the listing
        listing.inquiries += 1;
        await listing.save();
        // Notify the Mover
        try {
            const seeker = await models_1.User.findById(seekerId).select('firstName lastName');
            await notification_service_1.default.createNotification({
                user: listing.mover.toString(),
                type: 'system',
                title: 'New Inquiry on Your Listing',
                body: `${seeker?.firstName || 'Someone'} is interested in taking over your apartment`,
                data: { dealId: deal._id.toString(), listingId: listing._id.toString() },
            });
        }
        catch { }
        return deal;
    }
    async acceptInquiry(dealId, moverId) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.mover.toString() !== moverId)
            throw new Error('Unauthorized');
        if (deal.status !== 'inquiry_sent')
            throw new Error('This inquiry cannot be accepted in its current state');
        deal.status = 'inspection_scheduled';
        deal.timeline.push({
            event: 'inquiry_accepted',
            actor: moverId,
            timestamp: new Date(),
            note: 'Mover accepted the inquiry — inspection can be scheduled',
        });
        await deal.save();
        // Notify Seeker
        try {
            await notification_service_1.default.createNotification({
                user: deal.seeker.toString(),
                type: 'system',
                title: 'Inquiry Accepted',
                body: 'The current tenant accepted your inquiry. You can now schedule an inspection.',
                data: { dealId: deal._id.toString() },
            });
        }
        catch { }
        return deal;
    }
    async markAgreed(dealId, userId) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.mover.toString() !== userId && deal.seeker.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        if (!['inspection_scheduled', 'inspection_done'].includes(deal.status)) {
            throw new Error('Deal must be in inspection stage to mark as agreed');
        }
        deal.status = 'agreed';
        deal.timeline.push({
            event: 'deal_agreed',
            actor: userId,
            timestamp: new Date(),
            note: 'Both parties agreed to proceed — awaiting payment',
        });
        await deal.save();
        return deal;
    }
    // =======================
    // PAYMENT / ESCROW
    // =======================
    async initiatePayment(dealId, seekerId) {
        const deal = await models_1.MoveOutDeal.findById(dealId).populate('listing');
        if (!deal)
            throw new Error('Deal not found');
        if (deal.seeker.toString() !== seekerId)
            throw new Error('Unauthorized');
        if (!['agreed', 'payment_pending'].includes(deal.status)) {
            throw new Error('Deal is not ready for payment');
        }
        const seeker = await models_1.User.findById(seekerId).select('email firstName');
        if (!seeker?.email)
            throw new Error('Your account has no email on file');
        const reference = `ROOMIE_MVO_${deal._id.toString().slice(-8)}_${(0, nanoid_1.nanoid)(8)}`;
        const amountKobo = deal.referralFeeAmount * 100;
        const txn = await paystack_service_1.default.initializeTransaction({
            email: seeker.email,
            amount: amountKobo,
            reference,
            metadata: {
                dealId: deal._id.toString(),
                type: 'moving_out_referral',
                seekerId: seekerId,
                moverId: deal.mover.toString(),
            },
        });
        deal.paystackReference = reference;
        deal.paystackAuthorizationUrl = txn.authorization_url;
        deal.status = 'payment_pending';
        deal.timeline.push({
            event: 'payment_initiated',
            actor: seekerId,
            timestamp: new Date(),
            note: `Payment of ₦${deal.referralFeeAmount.toLocaleString()} initialized`,
        });
        await deal.save();
        return {
            authorization_url: txn.authorization_url,
            reference,
        };
    }
    /**
     * Called by webhook OR manually after Paystack confirms the payment
     */
    async handlePaymentSuccess(reference) {
        const deal = await models_1.MoveOutDeal.findOne({ paystackReference: reference });
        if (!deal) {
            logger_1.default.warn(`handlePaymentSuccess: no deal found for reference ${reference}`);
            return null;
        }
        if (deal.status === 'payment_escrowed') {
            logger_1.default.info(`Deal ${deal._id} already in payment_escrowed, skipping`);
            return deal;
        }
        // Verify with Paystack to be safe
        try {
            const verified = await paystack_service_1.default.verifyTransaction(reference);
            if (verified.status !== 'success') {
                logger_1.default.warn(`Paystack verification failed for ${reference}: ${verified.status}`);
                return null;
            }
            deal.paidAt = new Date(verified.paid_at || Date.now());
            deal.paymentChannel = verified.channel;
        }
        catch (e) {
            logger_1.default.error('Failed to verify transaction:', e);
            // Still proceed — the webhook is authoritative if signature was valid
        }
        deal.status = 'payment_escrowed';
        deal.timeline.push({
            event: 'payment_escrowed',
            timestamp: new Date(),
            note: `Referral fee of ₦${deal.referralFeeAmount.toLocaleString()} received and held in escrow`,
        });
        await deal.save();
        // Update the listing to in_deal
        await models_1.MovingOutListing.findByIdAndUpdate(deal.listing, { status: 'in_deal' });
        // Notify both parties
        try {
            await notification_service_1.default.createNotification({
                user: deal.mover.toString(),
                type: 'system',
                title: '💰 Escrow Payment Received',
                body: 'The seeker has paid the referral fee. It will be released to you after they confirm move-in.',
                data: { dealId: deal._id.toString() },
            });
            await notification_service_1.default.createNotification({
                user: deal.seeker.toString(),
                type: 'system',
                title: 'Payment Received',
                body: 'Your payment is safely in escrow. Confirm move-in to release funds to the outgoing tenant.',
                data: { dealId: deal._id.toString() },
            });
        }
        catch { }
        return deal;
    }
    /**
     * Seeker confirms they've moved in — starts the dispute window
     */
    async confirmMoveIn(dealId, seekerId) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.seeker.toString() !== seekerId)
            throw new Error('Only the seeker can confirm move-in');
        if (deal.status !== 'payment_escrowed') {
            throw new Error('Deal must be in escrow to confirm move-in');
        }
        const now = new Date();
        deal.status = 'moved_in';
        deal.moveInConfirmedAt = now;
        deal.disputeWindowEndsAt = new Date(now.getTime() + DISPUTE_WINDOW_HOURS * 60 * 60 * 1000);
        deal.timeline.push({
            event: 'move_in_confirmed',
            actor: seekerId,
            timestamp: now,
            note: `Move-in confirmed. Dispute window ends in ${DISPUTE_WINDOW_HOURS}h`,
        });
        await deal.save();
        // Notify Mover
        try {
            await notification_service_1.default.createNotification({
                user: deal.mover.toString(),
                type: 'system',
                title: 'Move-In Confirmed',
                body: `Seeker confirmed move-in. Funds will be released in ${DISPUTE_WINDOW_HOURS} hours if no issues are raised.`,
                data: { dealId: deal._id.toString() },
            });
        }
        catch { }
        return deal;
    }
    /**
     * Set Mover's bank account for payout (can be done before or after payment)
     */
    async setMoverBankDetails(dealId, moverId, bank) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.mover.toString() !== moverId)
            throw new Error('Unauthorized');
        // Resolve account to verify
        const resolved = await paystack_service_1.default.resolveAccount(bank.accountNumber, bank.bankCode);
        deal.moverBankDetails = {
            bankCode: bank.bankCode,
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountName: resolved.account_name,
        };
        await deal.save();
        return deal;
    }
    /**
     * Release escrow to Mover — called automatically after dispute window or manually by admin
     */
    async releaseEscrow(dealId) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.status !== 'moved_in' && deal.status !== 'dispute_open') {
            throw new Error('Deal is not eligible for escrow release');
        }
        if (!deal.moverBankDetails) {
            throw new Error('Mover has not provided bank details yet');
        }
        // Create transfer recipient if we don't have one
        if (!deal.payoutRecipientCode) {
            const recipient = await paystack_service_1.default.createTransferRecipient({
                name: deal.moverBankDetails.accountName,
                accountNumber: deal.moverBankDetails.accountNumber,
                bankCode: deal.moverBankDetails.bankCode,
            });
            deal.payoutRecipientCode = recipient.recipient_code;
        }
        const payoutReference = `PAYOUT_${deal._id.toString().slice(-8)}_${(0, nanoid_1.nanoid)(6)}`;
        const amountKobo = deal.netToMover * 100;
        try {
            const transfer = await paystack_service_1.default.initiateTransfer({
                amount: amountKobo,
                recipientCode: deal.payoutRecipientCode,
                reason: `Roomie Moving Out referral payout (Deal ${deal._id.toString().slice(-6)})`,
                reference: payoutReference,
            });
            deal.payoutReference = payoutReference;
            deal.payoutStatus = transfer.status === 'success' ? 'success' : 'pending';
            deal.payoutAt = new Date();
            deal.status = 'completed';
            deal.timeline.push({
                event: 'escrow_released',
                timestamp: new Date(),
                note: `Payout of ₦${deal.netToMover.toLocaleString()} initiated to ${deal.moverBankDetails.bankName}`,
            });
            await deal.save();
            // Mark listing as completed
            await models_1.MovingOutListing.findByIdAndUpdate(deal.listing, { status: 'completed' });
            // Notify Mover
            try {
                await notification_service_1.default.createNotification({
                    user: deal.mover.toString(),
                    type: 'system',
                    title: '💸 Payout Sent',
                    body: `₦${deal.netToMover.toLocaleString()} has been sent to your ${deal.moverBankDetails.bankName} account.`,
                    data: { dealId: deal._id.toString() },
                });
            }
            catch { }
            return deal;
        }
        catch (err) {
            deal.payoutStatus = 'failed';
            deal.payoutFailureReason = err.message;
            deal.timeline.push({
                event: 'payout_failed',
                timestamp: new Date(),
                note: `Payout failed: ${err.message}`,
            });
            await deal.save();
            throw err;
        }
    }
    /**
     * Open a dispute during the dispute window
     */
    async openDispute(dealId, userId, reason) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.mover.toString() !== userId && deal.seeker.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        if (!['payment_escrowed', 'moved_in'].includes(deal.status)) {
            throw new Error('Cannot open dispute on this deal');
        }
        if (deal.status === 'moved_in' && deal.disputeWindowEndsAt && new Date() > deal.disputeWindowEndsAt) {
            throw new Error('The dispute window has closed');
        }
        deal.status = 'dispute_open';
        deal.disputeOpenedBy = userId;
        deal.disputeOpenedAt = new Date();
        deal.disputeReason = reason;
        deal.timeline.push({
            event: 'dispute_opened',
            actor: userId,
            timestamp: new Date(),
            note: reason,
        });
        await deal.save();
        // Notify admins/other party
        try {
            const otherPartyId = deal.mover.toString() === userId ? deal.seeker : deal.mover;
            await notification_service_1.default.createNotification({
                user: otherPartyId.toString(),
                type: 'system',
                title: 'Dispute Opened',
                body: 'A dispute has been opened on your moving out deal. Our team will review.',
                data: { dealId: deal._id.toString() },
            });
        }
        catch { }
        return deal;
    }
    /**
     * Admin resolves a dispute
     */
    async resolveDispute(dealId, resolution, notes) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.status !== 'dispute_open')
            throw new Error('Deal is not in dispute');
        deal.disputeResolution = resolution;
        deal.disputeResolvedAt = new Date();
        deal.disputeNotes = notes;
        if (resolution === 'refunded') {
            // Refund the Seeker
            if (deal.paystackReference) {
                try {
                    await paystack_service_1.default.refundTransaction(deal.paystackReference);
                    deal.status = 'refunded';
                    deal.timeline.push({
                        event: 'dispute_resolved_refund',
                        timestamp: new Date(),
                        note: notes,
                    });
                }
                catch (err) {
                    logger_1.default.error('Refund failed:', err);
                    throw new Error('Refund could not be processed automatically. Handle manually.');
                }
            }
        }
        else if (resolution === 'released') {
            deal.timeline.push({
                event: 'dispute_resolved_release',
                timestamp: new Date(),
                note: notes,
            });
            await deal.save();
            return this.releaseEscrow(dealId);
        }
        await deal.save();
        return deal;
    }
    /**
     * Cancel a deal before payment
     */
    async cancelDeal(dealId, userId, reason) {
        const deal = await models_1.MoveOutDeal.findById(dealId);
        if (!deal)
            throw new Error('Deal not found');
        if (deal.mover.toString() !== userId && deal.seeker.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        if (['payment_escrowed', 'moved_in', 'completed', 'refunded'].includes(deal.status)) {
            throw new Error('Cannot cancel a deal that has already been paid or completed');
        }
        deal.status = 'cancelled';
        deal.cancelledBy = userId;
        deal.cancelledAt = new Date();
        deal.cancellationReason = reason;
        deal.timeline.push({
            event: 'deal_cancelled',
            actor: userId,
            timestamp: new Date(),
            note: reason,
        });
        await deal.save();
        // Reopen the listing if it was marked in_deal
        const listing = await models_1.MovingOutListing.findById(deal.listing);
        if (listing && listing.status === 'in_deal') {
            listing.status = 'active';
            await listing.save();
        }
        return deal;
    }
    async getDeal(dealId, userId) {
        const deal = await models_1.MoveOutDeal.findById(dealId)
            .populate('listing')
            .populate('mover', 'firstName lastName profilePhoto verified')
            .populate('seeker', 'firstName lastName profilePhoto verified');
        if (!deal)
            throw new Error('Deal not found');
        const isParticipant = deal.mover._id.toString() === userId || deal.seeker._id.toString() === userId;
        if (!isParticipant)
            throw new Error('Unauthorized');
        return deal;
    }
    async getMyDeals(userId, role) {
        const query = {};
        if (role === 'mover')
            query.mover = userId;
        else if (role === 'seeker')
            query.seeker = userId;
        else
            query.$or = [{ mover: userId }, { seeker: userId }];
        return models_1.MoveOutDeal.find(query)
            .populate('listing', 'title photos location monthlyRent referralFee moveOutDate')
            .populate('mover', 'firstName lastName profilePhoto')
            .populate('seeker', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
    }
    /**
     * Cron-worthy: release escrow for all deals where the dispute window has expired
     */
    async autoReleaseExpiredEscrows() {
        const now = new Date();
        const eligible = await models_1.MoveOutDeal.find({
            status: 'moved_in',
            disputeWindowEndsAt: { $lte: now },
        });
        let released = 0;
        let failed = 0;
        for (const deal of eligible) {
            try {
                if (deal.moverBankDetails) {
                    await this.releaseEscrow(deal._id.toString());
                    released++;
                }
            }
            catch (err) {
                logger_1.default.error(`Auto-release failed for deal ${deal._id}:`, err);
                failed++;
            }
        }
        return { released, failed };
    }
}
exports.default = new MovingOutService();
//# sourceMappingURL=movingOut.service.js.map