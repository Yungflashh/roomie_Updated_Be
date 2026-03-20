import { IRentalAgreementDocument } from '../models';
declare class RentalAgreementService {
    /**
     * Create a rental agreement from an accepted inquiry
     */
    createAgreement(inquiryId: string, createdBy: string, terms: {
        monthlyRent: number;
        securityDeposit?: number;
        moveInDate: string;
        leaseDuration: number;
        paymentDueDay?: number;
        utilitiesIncluded?: boolean;
        additionalTerms?: string;
    }): Promise<IRentalAgreementDocument>;
    /**
     * Get agreement by ID
     */
    getAgreement(agreementId: string, userId: string): Promise<IRentalAgreementDocument>;
    /**
     * Get agreement by inquiry ID
     */
    getByInquiry(inquiryId: string): Promise<IRentalAgreementDocument | null>;
    /**
     * Update agreement terms (only before signing)
     */
    updateTerms(agreementId: string, userId: string, terms: any): Promise<IRentalAgreementDocument>;
    /**
     * Sign agreement
     */
    signAgreement(agreementId: string, userId: string, fullName: string): Promise<IRentalAgreementDocument>;
    /**
     * Get all agreements for a user
     */
    getUserAgreements(userId: string): Promise<IRentalAgreementDocument[]>;
    /**
     * Terminate agreement
     */
    terminateAgreement(agreementId: string, userId: string): Promise<IRentalAgreementDocument>;
}
declare const _default: RentalAgreementService;
export default _default;
//# sourceMappingURL=rentalAgreement.service.d.ts.map