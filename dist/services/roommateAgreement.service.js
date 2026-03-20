"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/roommateAgreement.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const RoommateAgreement_1 = require("../models/RoommateAgreement");
const RoommateConnection_1 = require("../models/RoommateConnection");
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateAgreementService {
    /**
     * Get or create an agreement for a match.
     * Looks up the Match to find the two users, then creates the agreement if it doesn't exist.
     */
    async getOrCreateAgreement(matchId, userId) {
        // Check if agreement already exists for this match
        let agreement = await RoommateAgreement_1.RoommateAgreement.findOne({ match: matchId })
            .populate('party1.user', 'firstName lastName profilePhoto')
            .populate('party2.user', 'firstName lastName profilePhoto');
        if (agreement) {
            return agreement;
        }
        // Find the match to get both users
        const Match = mongoose_1.default.model('Match');
        const match = await Match.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }
        const user1Id = match.user1.toString();
        const user2Id = match.user2.toString();
        // Verify the requesting user is part of this match
        if (userId !== user1Id && userId !== user2Id) {
            throw new Error('You are not part of this match');
        }
        // Verify both users are connected as roommates
        const connection = await RoommateConnection_1.RoommateConnection.findOne({
            match: matchId,
            status: 'accepted',
        });
        if (!connection) {
            throw new Error('You must be connected as roommates before creating an agreement');
        }
        // Create the agreement
        agreement = new RoommateAgreement_1.RoommateAgreement({
            match: new mongoose_1.default.Types.ObjectId(matchId),
            party1: {
                user: new mongoose_1.default.Types.ObjectId(user1Id),
                fullName: '',
            },
            party2: {
                user: new mongoose_1.default.Types.ObjectId(user2Id),
                fullName: '',
            },
            status: 'pending',
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
        });
        await agreement.save();
        logger_1.default.info(`Agreement created for match ${matchId} by user ${userId}`);
        return agreement
            .populate('party1.user', 'firstName lastName profilePhoto')
            .then(doc => doc.populate('party2.user', 'firstName lastName profilePhoto'));
    }
    /**
     * Get agreement for a match
     */
    async getAgreementByMatch(matchId) {
        return RoommateAgreement_1.RoommateAgreement.findOne({ match: matchId })
            .populate('party1.user', 'firstName lastName profilePhoto')
            .populate('party2.user', 'firstName lastName profilePhoto');
    }
    /**
     * Sign the agreement - fill in name and optional details
     */
    async signAgreement(agreementId, userId, data) {
        const agreement = await RoommateAgreement_1.RoommateAgreement.findById(agreementId);
        if (!agreement) {
            throw new Error('Agreement not found');
        }
        const isParty1 = agreement.party1.user.toString() === userId;
        const isParty2 = agreement.party2.user.toString() === userId;
        if (!isParty1 && !isParty2) {
            throw new Error('You are not part of this agreement');
        }
        // Check if already signed
        if (isParty1 && agreement.party1.signedAt) {
            throw new Error('You have already signed this agreement');
        }
        if (isParty2 && agreement.party2.signedAt) {
            throw new Error('You have already signed this agreement');
        }
        // Update the party's info
        if (isParty1) {
            agreement.party1.fullName = data.fullName;
            agreement.party1.signedAt = new Date();
        }
        else {
            agreement.party2.fullName = data.fullName;
            agreement.party2.signedAt = new Date();
        }
        // Update optional shared fields (first signer sets them, second can update)
        if (data.moveInDate)
            agreement.moveInDate = data.moveInDate;
        if (data.leaseEndDate)
            agreement.leaseEndDate = data.leaseEndDate;
        if (data.rentAmount)
            agreement.rentAmount = data.rentAmount;
        if (data.address)
            agreement.address = data.address;
        // Check if both have signed
        if (agreement.party1.signedAt && agreement.party2.signedAt) {
            agreement.status = 'active';
            logger_1.default.info(`Agreement ${agreementId} is now active - both parties signed`);
        }
        else {
            agreement.status = 'signed';
        }
        await agreement.save();
        // Notify the other party
        const otherUserId = isParty1
            ? agreement.party2.user.toString()
            : agreement.party1.user.toString();
        (0, socket_config_1.emitToUser)(otherUserId, 'agreement:signed', {
            agreementId: agreement._id,
            signedBy: userId,
            isFullySigned: agreement.status === 'active',
        });
        logger_1.default.info(`Agreement ${agreementId} signed by user ${userId}`);
        return agreement
            .populate('party1.user', 'firstName lastName profilePhoto')
            .then(doc => doc.populate('party2.user', 'firstName lastName profilePhoto'));
    }
    /**
     * Get all agreements for a user
     */
    async getMyAgreements(userId) {
        return RoommateAgreement_1.RoommateAgreement.find({
            $or: [
                { 'party1.user': userId },
                { 'party2.user': userId },
            ],
        })
            .populate('party1.user', 'firstName lastName profilePhoto')
            .populate('party2.user', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
    }
}
exports.default = new RoommateAgreementService();
//# sourceMappingURL=roommateAgreement.service.js.map