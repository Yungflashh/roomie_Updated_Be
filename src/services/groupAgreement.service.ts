// src/services/groupAgreement.service.ts
import mongoose from 'mongoose';
import { GroupAgreement, IGroupAgreementDocument } from '../models/GroupAgreement';
import { RoommateGroup } from '../models/RoommateGroup';
import { emitToUser, getIO } from '../config/socket.config';
import logger from '../utils/logger';

class GroupAgreementService {
  /**
   * Get or create agreement for a group
   */
  async getOrCreateAgreement(
    groupId: string,
    userId: string
  ): Promise<IGroupAgreementDocument> {
    const group = await RoommateGroup.findById(groupId);
    if (!group || !group.isActive) {
      throw new Error('Group not found');
    }

    const isUserInGroup = group.members.some(
      m => m.user.toString() === userId && m.status === 'active'
    );
    if (!isUserInGroup) {
      throw new Error('You are not a member of this group');
    }

    // Check if agreement already exists
    let agreement = await GroupAgreement.findOne({ group: groupId })
      .populate('signatories.user', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 });

    if (agreement) {
      return agreement;
    }

    // Create with all active members as signatories
    const activeMembers = group.members.filter(m => m.status === 'active');

    agreement = new GroupAgreement({
      group: new mongoose.Types.ObjectId(groupId),
      signatories: activeMembers.map(m => ({
        user: m.user,
        fullName: '',
      })),
      status: 'pending',
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await agreement.save();

    logger.info(`Group agreement created for group ${groupId} by user ${userId}`);

    return agreement.populate('signatories.user', 'firstName lastName profilePhoto');
  }

  /**
   * Get agreement for a group
   */
  async getAgreementByGroup(groupId: string): Promise<IGroupAgreementDocument | null> {
    return GroupAgreement.findOne({ group: groupId })
      .populate('signatories.user', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 });
  }

  /**
   * Sign the group agreement
   */
  async signAgreement(
    agreementId: string,
    userId: string,
    data: {
      fullName: string;
      moveInDate?: string;
      leaseEndDate?: string;
      rentAmount?: string;
      address?: string;
    }
  ): Promise<IGroupAgreementDocument> {
    const agreement = await GroupAgreement.findById(agreementId);
    if (!agreement) {
      throw new Error('Agreement not found');
    }

    const signatoryIdx = agreement.signatories.findIndex(
      s => s.user.toString() === userId
    );
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
    if (data.moveInDate) agreement.moveInDate = data.moveInDate;
    if (data.leaseEndDate) agreement.leaseEndDate = data.leaseEndDate;
    if (data.rentAmount) agreement.rentAmount = data.rentAmount;
    if (data.address) agreement.address = data.address;

    // Check status
    const allSigned = agreement.signatories.every(s => s.signedAt);
    const someSigned = agreement.signatories.some(s => s.signedAt);

    if (allSigned) {
      agreement.status = 'active';
      logger.info(`Group agreement ${agreementId} is now active`);
    } else if (someSigned) {
      agreement.status = 'partial';
    }

    await agreement.save();

    // Notify other members
    const io = getIO();
    if (io) {
      io.to(`group:${agreement.group}`).emit('groupAgreement:signed', {
        agreementId: agreement._id,
        signedBy: userId,
        isFullySigned: agreement.status === 'active',
      });
    }

    logger.info(`Group agreement ${agreementId} signed by user ${userId}`);

    return agreement.populate('signatories.user', 'firstName lastName profilePhoto');
  }
}

export default new GroupAgreementService();
