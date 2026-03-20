import { IGroupAgreementDocument } from '../models/GroupAgreement';
declare class GroupAgreementService {
    /**
     * Get or create agreement for a group
     */
    getOrCreateAgreement(groupId: string, userId: string): Promise<IGroupAgreementDocument>;
    /**
     * Get agreement for a group
     */
    getAgreementByGroup(groupId: string): Promise<IGroupAgreementDocument | null>;
    /**
     * Sign the group agreement
     */
    signAgreement(agreementId: string, userId: string, data: {
        fullName: string;
        moveInDate?: string;
        leaseEndDate?: string;
        rentAmount?: string;
        address?: string;
    }): Promise<IGroupAgreementDocument>;
}
declare const _default: GroupAgreementService;
export default _default;
//# sourceMappingURL=groupAgreement.service.d.ts.map