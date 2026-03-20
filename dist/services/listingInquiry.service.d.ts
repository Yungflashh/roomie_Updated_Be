import { IListingInquiryDocument } from '../models';
declare class ListingInquiryService {
    /**
     * Create or get an inquiry for a property
     */
    createInquiry(seekerId: string, listerId: string, propertyId: string): Promise<IListingInquiryDocument>;
    /**
     * Get inquiry by ID with populated fields
     */
    getInquiry(inquiryId: string, userId: string): Promise<IListingInquiryDocument>;
    /**
     * Get all inquiries for seeker
     */
    getSeekerInquiries(seekerId: string): Promise<IListingInquiryDocument[]>;
    /**
     * Get all inquiries for lister (on their properties)
     */
    getListerInquiries(listerId: string): Promise<IListingInquiryDocument[]>;
    /**
     * Request a viewing
     */
    requestViewing(inquiryId: string, seekerId: string, data: {
        date: string;
        time: string;
        notes?: string;
    }): Promise<IListingInquiryDocument>;
    /**
     * Respond to viewing request (lister)
     */
    respondToViewing(inquiryId: string, listerId: string, data: {
        confirm: boolean;
        suggestedDate?: string;
        suggestedTime?: string;
    }): Promise<IListingInquiryDocument>;
    /**
     * Mark viewing as completed
     */
    completeViewing(inquiryId: string, userId: string): Promise<IListingInquiryDocument>;
    /**
     * Cancel viewing
     */
    cancelViewing(inquiryId: string, userId: string): Promise<IListingInquiryDocument>;
    /**
     * Make an offer (seeker)
     */
    makeOffer(inquiryId: string, seekerId: string, data: {
        price: number;
        moveInDate: string;
        leaseDuration: number;
        message?: string;
    }): Promise<IListingInquiryDocument>;
    /**
     * Respond to offer (lister)
     */
    respondToOffer(inquiryId: string, listerId: string, data: {
        accept: boolean;
        reason?: string;
    }): Promise<IListingInquiryDocument>;
    /**
     * Withdraw inquiry (seeker)
     */
    withdrawInquiry(inquiryId: string, seekerId: string): Promise<IListingInquiryDocument>;
}
declare const _default: ListingInquiryService;
export default _default;
//# sourceMappingURL=listingInquiry.service.d.ts.map