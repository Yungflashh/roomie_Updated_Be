"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const match_service_1 = __importDefault(require("./match.service"));
const toId = (id) => new mongoose_1.default.Types.ObjectId(id);
class ListingInquiryService {
    /**
     * Create or get an inquiry for a property
     */
    async createInquiry(seekerId, listerId, propertyId) {
        // Check if inquiry already exists
        const existing = await models_1.ListingInquiry.findOne({ seeker: seekerId, property: propertyId });
        if (existing)
            return existing;
        // Create/find the chat channel
        const match = await match_service_1.default.findOrCreateListingInquiry(seekerId, listerId, propertyId);
        const inquiry = await models_1.ListingInquiry.create({
            seeker: toId(seekerId),
            lister: toId(listerId),
            property: toId(propertyId),
            match: match._id,
            status: 'inquiry',
            statusHistory: [{ status: 'inquiry', changedBy: toId(seekerId), changedAt: new Date() }],
        });
        logger_1.default.info(`Listing inquiry created: ${seekerId} -> property ${propertyId}`);
        return inquiry;
    }
    /**
     * Get inquiry by ID with populated fields
     */
    async getInquiry(inquiryId, userId) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId)
            .populate('seeker', 'firstName lastName profilePhoto')
            .populate('lister', 'firstName lastName profilePhoto')
            .populate('property', 'title price photos location status type');
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker._id.toString() !== userId && inquiry.lister._id.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        return inquiry;
    }
    /**
     * Get all inquiries for seeker
     */
    async getSeekerInquiries(seekerId) {
        return models_1.ListingInquiry.find({ seeker: seekerId })
            .populate('lister', 'firstName lastName profilePhoto')
            .populate('property', 'title price photos location status type')
            .sort({ updatedAt: -1 });
    }
    /**
     * Get all inquiries for lister (on their properties)
     */
    async getListerInquiries(listerId) {
        return models_1.ListingInquiry.find({ lister: listerId })
            .populate('seeker', 'firstName lastName profilePhoto')
            .populate('property', 'title price photos location status type')
            .sort({ updatedAt: -1 });
    }
    /**
     * Request a viewing
     */
    async requestViewing(inquiryId, seekerId, data) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker.toString() !== seekerId)
            throw new Error('Only the seeker can request a viewing');
        if (!['inquiry', 'viewed'].includes(inquiry.status))
            throw new Error('Cannot request viewing at this stage');
        inquiry.viewing = {
            requestedDate: new Date(data.date),
            requestedTime: data.time,
            notes: data.notes,
            status: 'pending',
        };
        inquiry.status = 'viewing_requested';
        inquiry.statusHistory.push({ status: 'viewing_requested', changedBy: toId(seekerId), changedAt: new Date() });
        await inquiry.save();
        logger_1.default.info(`Viewing requested for inquiry ${inquiryId}`);
        return inquiry;
    }
    /**
     * Respond to viewing request (lister)
     */
    async respondToViewing(inquiryId, listerId, data) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.lister.toString() !== listerId)
            throw new Error('Only the lister can respond');
        if (inquiry.status !== 'viewing_requested')
            throw new Error('No pending viewing request');
        if (data.confirm) {
            inquiry.viewing.confirmedDate = inquiry.viewing.requestedDate;
            inquiry.viewing.confirmedTime = inquiry.viewing.requestedTime;
            inquiry.viewing.status = 'confirmed';
            inquiry.status = 'viewing_scheduled';
        }
        else if (data.suggestedDate && data.suggestedTime) {
            inquiry.viewing.confirmedDate = new Date(data.suggestedDate);
            inquiry.viewing.confirmedTime = data.suggestedTime;
            inquiry.viewing.status = 'rescheduled';
            inquiry.status = 'viewing_scheduled';
        }
        inquiry.statusHistory.push({ status: inquiry.status, changedBy: toId(listerId), changedAt: new Date() });
        await inquiry.save();
        logger_1.default.info(`Viewing response for inquiry ${inquiryId}: ${data.confirm ? 'confirmed' : 'rescheduled'}`);
        return inquiry;
    }
    /**
     * Mark viewing as completed
     */
    async completeViewing(inquiryId, userId) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker.toString() !== userId && inquiry.lister.toString() !== userId)
            throw new Error('Unauthorized');
        if (inquiry.status !== 'viewing_scheduled')
            throw new Error('No scheduled viewing to complete');
        inquiry.viewing.status = 'completed';
        inquiry.status = 'viewed';
        inquiry.statusHistory.push({ status: 'viewed', changedBy: toId(userId), changedAt: new Date() });
        await inquiry.save();
        return inquiry;
    }
    /**
     * Cancel viewing
     */
    async cancelViewing(inquiryId, userId) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker.toString() !== userId && inquiry.lister.toString() !== userId)
            throw new Error('Unauthorized');
        inquiry.viewing.status = 'cancelled';
        inquiry.status = 'inquiry';
        inquiry.statusHistory.push({ status: 'viewing_cancelled', changedBy: toId(userId), changedAt: new Date() });
        await inquiry.save();
        return inquiry;
    }
    /**
     * Make an offer (seeker)
     */
    async makeOffer(inquiryId, seekerId, data) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker.toString() !== seekerId)
            throw new Error('Only the seeker can make an offer');
        if (!['inquiry', 'viewed'].includes(inquiry.status))
            throw new Error('Cannot make offer at this stage');
        inquiry.offer = {
            price: data.price,
            moveInDate: new Date(data.moveInDate),
            leaseDuration: data.leaseDuration,
            message: data.message,
            response: 'pending',
        };
        inquiry.status = 'offer_made';
        inquiry.statusHistory.push({ status: 'offer_made', changedBy: toId(seekerId), changedAt: new Date() });
        await inquiry.save();
        logger_1.default.info(`Offer made on inquiry ${inquiryId}: ₦${data.price}`);
        return inquiry;
    }
    /**
     * Respond to offer (lister)
     */
    async respondToOffer(inquiryId, listerId, data) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.lister.toString() !== listerId)
            throw new Error('Only the lister can respond to offers');
        if (inquiry.status !== 'offer_made')
            throw new Error('No pending offer');
        inquiry.offer.respondedAt = new Date();
        if (data.accept) {
            inquiry.offer.response = 'accepted';
            inquiry.status = 'accepted';
        }
        else {
            inquiry.offer.response = 'declined';
            inquiry.status = 'declined';
        }
        inquiry.statusHistory.push({
            status: inquiry.status,
            changedBy: toId(listerId),
            changedAt: new Date(),
            note: data.reason,
        });
        await inquiry.save();
        // If accepted, decline all other active inquiries for this property
        if (data.accept) {
            await models_1.ListingInquiry.updateMany({ property: inquiry.property, _id: { $ne: inquiry._id }, status: { $nin: ['declined', 'withdrawn', 'expired', 'accepted'] } }, { $set: { status: 'expired' } });
        }
        logger_1.default.info(`Offer ${data.accept ? 'accepted' : 'declined'} for inquiry ${inquiryId}`);
        return inquiry;
    }
    /**
     * Withdraw inquiry (seeker)
     */
    async withdrawInquiry(inquiryId, seekerId) {
        const inquiry = await models_1.ListingInquiry.findById(inquiryId);
        if (!inquiry)
            throw new Error('Inquiry not found');
        if (inquiry.seeker.toString() !== seekerId)
            throw new Error('Only the seeker can withdraw');
        if (['accepted', 'withdrawn', 'expired'].includes(inquiry.status))
            throw new Error('Cannot withdraw at this stage');
        inquiry.status = 'withdrawn';
        inquiry.statusHistory.push({ status: 'withdrawn', changedBy: toId(seekerId), changedAt: new Date() });
        await inquiry.save();
        return inquiry;
    }
}
exports.default = new ListingInquiryService();
//# sourceMappingURL=listingInquiry.service.js.map