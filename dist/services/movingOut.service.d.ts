import { IMovingOutListingDocument, IMoveOutDealDocument } from '../models';
declare class MovingOutService {
    createListing(moverId: string, data: Partial<IMovingOutListingDocument>): Promise<IMovingOutListingDocument>;
    updateListing(listingId: string, moverId: string, data: Partial<IMovingOutListingDocument>): Promise<IMovingOutListingDocument>;
    deleteListing(listingId: string, moverId: string): Promise<void>;
    getListing(listingId: string, viewerId?: string): Promise<IMovingOutListingDocument>;
    listMyListings(moverId: string): Promise<IMovingOutListingDocument[]>;
    searchListings(filters: {
        city?: string;
        state?: string;
        minRent?: number;
        maxRent?: number;
        bedrooms?: number;
        furnished?: boolean;
        availableFrom?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        listings: IMovingOutListingDocument[];
        total: number;
        page: number;
        pages: number;
    }>;
    createDeal(listingId: string, seekerId: string): Promise<IMoveOutDealDocument>;
    acceptInquiry(dealId: string, moverId: string): Promise<IMoveOutDealDocument>;
    markAgreed(dealId: string, userId: string): Promise<IMoveOutDealDocument>;
    initiatePayment(dealId: string, seekerId: string): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    /**
     * Called by webhook OR manually after Paystack confirms the payment
     */
    handlePaymentSuccess(reference: string): Promise<IMoveOutDealDocument | null>;
    /**
     * Seeker confirms they've moved in — starts the dispute window
     */
    confirmMoveIn(dealId: string, seekerId: string): Promise<IMoveOutDealDocument>;
    /**
     * Set Mover's bank account for payout (can be done before or after payment)
     */
    setMoverBankDetails(dealId: string, moverId: string, bank: {
        bankCode: string;
        bankName: string;
        accountNumber: string;
    }): Promise<IMoveOutDealDocument>;
    /**
     * Release escrow to Mover — called automatically after dispute window or manually by admin
     */
    releaseEscrow(dealId: string): Promise<IMoveOutDealDocument>;
    /**
     * Open a dispute during the dispute window
     */
    openDispute(dealId: string, userId: string, reason: string): Promise<IMoveOutDealDocument>;
    /**
     * Admin resolves a dispute
     */
    resolveDispute(dealId: string, resolution: 'refunded' | 'released' | 'partial', notes: string): Promise<IMoveOutDealDocument>;
    /**
     * Cancel a deal before payment
     */
    cancelDeal(dealId: string, userId: string, reason: string): Promise<IMoveOutDealDocument>;
    getDeal(dealId: string, userId: string): Promise<IMoveOutDealDocument>;
    getMyDeals(userId: string, role?: 'mover' | 'seeker'): Promise<IMoveOutDealDocument[]>;
    /**
     * Cron-worthy: release escrow for all deals where the dispute window has expired
     */
    autoReleaseExpiredEscrows(): Promise<{
        released: number;
        failed: number;
    }>;
}
declare const _default: MovingOutService;
export default _default;
//# sourceMappingURL=movingOut.service.d.ts.map