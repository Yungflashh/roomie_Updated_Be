"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/groupAgreement.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const GroupAgreement_1 = require("../models/GroupAgreement");
const RoommateGroup_1 = require("../models/RoommateGroup");
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
class GroupAgreementService {
    /**
     * Get or create agreement for a group
     */
    async getOrCreateAgreement(groupId, userId) {
        const group = await RoommateGroup_1.RoommateGroup.findById(groupId);
        if (!group || !group.isActive) {
            throw new Error('Group not found');
        }
        const isUserInGroup = group.members.some(m => m.user.toString() === userId && m.status === 'active');
        if (!isUserInGroup) {
            throw new Error('You are not a member of this group');
        }
        // Check if agreement already exists
        let agreement = await GroupAgreement_1.GroupAgreement.findOne({ group: groupId })
            .populate('signatories.user', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
        if (agreement) {
            return agreement;
        }
        // Create with all active members as signatories
        const activeMembers = group.members.filter(m => m.status === 'active');
        agreement = new GroupAgreement_1.GroupAgreement({
            group: new mongoose_1.default.Types.ObjectId(groupId),
            signatories: activeMembers.map(m => ({
                user: m.user,
                fullName: '',
            })),
            status: 'pending',
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
        });
        await agreement.save();
        logger_1.default.info(`Group agreement created for group ${groupId} by user ${userId}`);
        return agreement.populate('signatories.user', 'firstName lastName profilePhoto');
    }
    /**
     * Get agreement for a group
     */
    async getAgreementByGroup(groupId) {
        return GroupAgreement_1.GroupAgreement.findOne({ group: groupId })
            .populate('signatories.user', 'firstName lastName profilePhoto')
            .sort({ createdAt: -1 });
    }
    /**
     * Sign the group agreement
     */
    async signAgreement(agreementId, userId, data) {
        const agreement = await GroupAgreement_1.GroupAgreement.findById(agreementId);
        if (!agreement) {
            throw new Error('Agreement not found');
        }
        const signatoryIdx = agreement.signatories.findIndex(s => s.user.toString() === userId);
        if (signatoryIdx === -1) {
            throw new Error('You are not part of this agreement');
        }
        if (agreement.signatories[signatoryIdx].signedAt) {
            throw new Error('You have already signed this agreement');
        }
        // Update signatory
        agreement.signatories[signatoryIdx].fullName = data.fullName;
        agreement.signatories[signatoryIdx].signedAt = new Date();
        // Update optional shared fields
        if (data.moveInDate)
            agreement.moveInDate = data.moveInDate;
        if (data.leaseEndDate)
            agreement.leaseEndDate = data.leaseEndDate;
        if (data.rentAmount)
            agreement.rentAmount = data.rentAmount;
        if (data.address)
            agreement.address = data.address;
        // Check status
        const allSigned = agreement.signatories.every(s => s.signedAt);
        const someSigned = agreement.signatories.some(s => s.signedAt);
        if (allSigned) {
            agreement.status = 'active';
            logger_1.default.info(`Group agreement ${agreementId} is now active`);
        }
        else if (someSigned) {
            agreement.status = 'partial';
        }
        await agreement.save();
        // Notify other members
        const io = (0, socket_config_1.getIO)();
        if (io) {
            io.to(`group:${agreement.group}`).emit('groupAgreement:signed', {
                agreementId: agreement._id,
                signedBy: userId,
                isFullySigned: agreement.status === 'active',
            });
        }
        logger_1.default.info(`Group agreement ${agreementId} signed by user ${userId}`);
        return agreement.populate('signatories.user', 'firstName lastName profilePhoto');
    }
}
exports.default = new GroupAgreementService();
//# sourceMappingURL=groupAgreement.service.js.map