import { IRoommateAgreementDocument } from '../models/RoommateAgreement';
declare class RoommateAgreementService {
    /**
     * Get or create an agreement for a match.
     * Looks up the Match to find the two users, then creates the agreement if it doesn't exist.
     */
    getOrCreateAgreement(matchId: string, userId: string): Promise<IRoommateAgreementDocument>;
    /**
     * Get agreement for a match
     */
    getAgreementByMatch(matchId: string): Promise<IRoommateAgreementDocument | null>;
    /**
     * Sign the agreement - fill in name and optional details
     */
    signAgreement(agreementId: string, userId: string, data: {
        fullName: string;
        moveInDate?: string;
        leaseEndDate?: string;
        rentAmount?: string;
        address?: string;
    }): Promise<IRoommateAgreementDocument>;
    /**
     * Get all agreements for a user
     */
    getMyAgreements(userId: string): Promise<IRoommateAgreementDocument[]>;
}
declare const _default: RoommateAgreementService;
export default _default;
//# sourceMappingURL=roommateAgreement.service.d.ts.map