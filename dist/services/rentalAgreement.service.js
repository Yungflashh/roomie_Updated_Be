"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
class RentalAgreementService {
    /**
     * Create a rental agreement from an accepted inquiry
     */
    async createAgreement(inquiryId, createdBy, terms) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.status !== 'accepted')
            throw new Error('Inquiry must be accepted before creating agreement');
        // Check if agreement already exists
        const existing = await models_1.RentalAgreement.findOne({ inquiry: inquiryId });
        if (existing)
            return existing;
        const moveInDate = new Date(terms.moveInDate);
        const leaseEndDate = new Date(moveInDate);
        leaseEndDate.setMonth(leaseEndDate.getMonth() + terms.leaseDuration);
        const agreement = await models_1.RentalAgreement.create({
            inquiry: inquiryId,
            property: inquiry.property,
            match: inquiry.match,
            landlord: { user: inquiry.lister, fullName: '' },
            tenant: { user: inquiry.seeker, fullName: '' },
            status: 'draft',
            terms: {
                monthlyRent: terms.monthlyRent,
                currency: 'NGN',
                securityDeposit: terms.securityDeposit,
                moveInDate,
                leaseEndDate,
                leaseDuration: terms.leaseDuration,
                paymentDueDay: terms.paymentDueDay || 1,
                utilitiesIncluded: terms.utilitiesIncluded || false,
                additionalTerms: terms.additionalTerms,
            },
            createdBy,
        });
        logger_1.default.info(`Rental agreement created for inquiry ${inquiryId}`);
        return agreement;
    }
    /**
     * Get agreement by ID
     */
    async getAgreement(agreementId, userId) {
        const agreement = await models_1.RentalAgreement.findById(agreementId)
            .populate('landlord.user', 'firstName lastName profilePhoto email')
            .populate('tenant.user', 'firstName lastName profilePhoto email')
            .populate('property', 'title price photos location');
        if (!agreement)
            throw new Error('Agreement not found');
        if (agreement.landlord.user._id.toString() !== userId && agreement.tenant.user._id.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        return agreement;
    }
    /**
     * Get agreement by inquiry ID
     */
    async getByInquiry(inquiryId) {
        return models_1.RentalAgreement.findOne({ inquiry: inquiryId })
            .populate('landlord.user', 'firstName lastName profilePhoto email')
            .populate('tenant.user', 'firstName lastName profilePhoto email')
            .populate('property', 'title price photos location');
    }
    /**
     * Update agreement terms (only before signing)
     */
    async updateTerms(agreementId, userId, terms) {
        const agreement = await models_1.RentalAgreement.findById(agreementId);
        if (!agreement)
            throw new Error('Agreement not found');
        if (!['draft', 'pending'].includes(agreement.status))
            throw new Error('Cannot edit signed agreement');
        Object.assign(agreement.terms, terms);
        if (terms.moveInDate && terms.leaseDuration) {
            const moveIn = new Date(terms.moveInDate);
            const leaseEnd = new Date(moveIn);
            leaseEnd.setMonth(leaseEnd.getMonth() + terms.leaseDuration);
            agreement.terms.leaseEndDate = leaseEnd;
        }
        agreement.status = 'pending';
        await agreement.save();
        return agreement;
    }
    /**
     * Sign agreement
     */
    async signAgreement(agreementId, userId, fullName) {
        const agreement = await models_1.RentalAgreement.findById(agreementId);
        if (!agreement)
            throw new Error('Agreement not found');
        if (!['draft', 'pending'].includes(agreement.status))
            throw new Error('Agreement cannot be signed at this stage');
        const isLandlord = agreement.landlord.user.toString() === userId;
        const isTenant = agreement.tenant.user.toString() === userId;
        if (!isLandlord && !isTenant)
            throw new Error('Unauthorized');
        if (isLandlord) {
            agreement.landlord.fullName = fullName;
            agreement.landlord.signedAt = new Date();
        }
        else {
            agreement.tenant.fullName = fullName;
            agreement.tenant.signedAt = new Date();
        }
        // If both have signed, activate
        if (agreement.landlord.signedAt && agreement.tenant.signedAt) {
            agreement.status = 'active';
            // Update property status to rented
            await models_1.Property.findByIdAndUpdate(agreement.property, { status: 'rented' });
            // Update inquiry status
            await models_1.ListingInquiry.findByIdAndUpdate(agreement.inquiry, { status: 'accepted' });
            logger_1.default.info(`Rental agreement ${agreementId} is now active. Property marked as rented.`);
        }
        else {
            agreement.status = 'pending';
        }
        await agreement.save();
        return agreement;
    }
    /**
     * Get all agreements for a user
     */
    async getUserAgreements(userId) {
        return models_1.RentalAgreement.find({
            $or: [{ 'landlord.user': userId }, { 'tenant.user': userId }],
        })
            .populate('landlord.user', 'firstName lastName profilePhoto')
            .populate('tenant.user', 'firstName lastName profilePhoto')
            .populate('property', 'title price photos location')
            .sort({ updatedAt: -1 });
    }
    /**
     * Terminate agreement
     */
    async terminateAgreement(agreementId, userId) {
        const agreement = await models_1.RentalAgreement.findById(agreementId);
        if (!agreement)
            throw new Error('Agreement not found');
        if (agreement.status !== 'active')
            throw new Error('Only active agreements can be terminated');
        agreement.status = 'terminated';
        await agreement.save();
        // Update property back to available
        await models_1.Property.findByIdAndUpdate(agreement.property, { status: 'available' });
        logger_1.default.info(`Rental agreement ${agreementId} terminated`);
        return agreement;
    }
}
exports.default = new RentalAgreementService();
//# sourceMappingURL=rentalAgreement.service.js.map