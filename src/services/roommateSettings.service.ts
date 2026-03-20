// src/services/roommateSettings.service.ts
import mongoose from 'mongoose';
import { User, RoommateGroup, Match } from '../models';
import logger from '../utils/logger';

class RoommateSettingsService {
  /**
   * Update group feature toggles (admin only)
   */
  async updateGroupFeatures(
    groupId: string,
    userId: string,
    features: { locationSharing?: boolean; emergencyAlerts?: boolean; personalityBoard?: boolean }
  ) {
    const group = await RoommateGroup.findById(groupId);
    if (!group) throw new Error('Group not found');

    const member = group.members.find(
      (m: any) => m.user.toString() === userId && m.status === 'active'
    );
    if (!member || member.role !== 'admin') {
      throw new Error('Only admins can update group features');
    }

    if (features.locationSharing !== undefined) group.features.locationSharing = features.locationSharing;
    if (features.emergencyAlerts !== undefined) group.features.emergencyAlerts = features.emergencyAlerts;
    if (features.personalityBoard !== undefined) group.features.personalityBoard = features.personalityBoard;

    await group.save();
    return group;
  }

  /**
   * Get roommate locations (only if group has locationSharing enabled AND user has it enabled in privacy)
   */
  async getRoommateLocations(groupId: string, userId: string) {
    const group = await RoommateGroup.findById(groupId);
    if (!group) throw new Error('Group not found');

    const member = group.members.find(
      (m: any) => m.user.toString() === userId && m.status === 'active'
    );
    if (!member) throw new Error('Not a member of this group');

    if (!group.features.locationSharing) {
      throw new Error('Location sharing is not enabled for this group');
    }

    const activeMembers = group.members
      .filter((m: any) => m.status === 'active')
      .map((m: any) => m.user);

    const users = await User.find({
      _id: { $in: activeMembers },
      'privacySettings.shareLocationWithRoommates': true,
    }).select('firstName lastName profilePhoto location.coordinates location.city lastSeen');

    return users.map((u: any) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePhoto: u.profilePhoto,
      location: u.location,
      lastSeen: u.lastSeen,
    }));
  }

  /**
   * Get emergency contacts for all group members
   */
  async getGroupEmergencyContacts(groupId: string, userId: string) {
    const group = await RoommateGroup.findById(groupId);
    if (!group) throw new Error('Group not found');

    const member = group.members.find(
      (m: any) => m.user.toString() === userId && m.status === 'active'
    );
    if (!member) throw new Error('Not a member of this group');

    if (!group.features.emergencyAlerts) {
      throw new Error('Emergency alerts are not enabled for this group');
    }

    const activeMembers = group.members
      .filter((m: any) => m.status === 'active')
      .map((m: any) => m.user);

    const users = await User.find({ _id: { $in: activeMembers } })
      .select('firstName lastName profilePhoto emergencyContacts');

    return users.map((u: any) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePhoto: u.profilePhoto,
      emergencyContacts: u.emergencyContacts || [],
    }));
  }

  /**
   * Get personality board for all group members
   */
  async getGroupPersonalityBoard(groupId: string, userId: string) {
    const group = await RoommateGroup.findById(groupId);
    if (!group) throw new Error('Group not found');

    const member = group.members.find(
      (m: any) => m.user.toString() === userId && m.status === 'active'
    );
    if (!member) throw new Error('Not a member of this group');

    const activeMembers = group.members
      .filter((m: any) => m.status === 'active')
      .map((m: any) => m.user);

    const users = await User.find({ _id: { $in: activeMembers } })
      .select('firstName lastName profilePhoto zodiacSign personalityType lifestyle interests dateOfBirth');

    return users.map((u: any) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePhoto: u.profilePhoto,
      zodiacSign: u.zodiacSign,
      personalityType: u.personalityType,
      lifestyle: u.lifestyle,
      interests: u.interests || [],
      dateOfBirth: u.dateOfBirth,
    }));
  }

  /**
   * Update user's emergency contacts
   */
  async updateEmergencyContacts(
    userId: string,
    contacts: Array<{ name: string; phone: string; relationship: string }>
  ) {
    if (contacts.length > 3) throw new Error('Maximum 3 emergency contacts allowed');

    const user = await User.findByIdAndUpdate(
      userId,
      { emergencyContacts: contacts },
      { new: true }
    ).select('emergencyContacts');

    return user?.emergencyContacts || [];
  }

  /**
   * Update user zodiac & personality
   */
  async updatePersonalityInfo(
    userId: string,
    data: { zodiacSign?: string; personalityType?: string }
  ) {
    const update: any = {};
    if (data.zodiacSign) update.zodiacSign = data.zodiacSign;
    if (data.personalityType) update.personalityType = data.personalityType;

    const user = await User.findByIdAndUpdate(userId, update, { new: true })
      .select('zodiacSign personalityType');

    return user;
  }

  // =============================================
  // 1-on-1 MATCH-BASED METHODS
  // =============================================

  /**
   * Get matched user's location (1-on-1)
   * Both users must have shareLocationWithRoommates enabled
   */
  async getMatchLocation(matchId: string, userId: string) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(userId)) throw new Error('Not part of this match');

    const otherUserId = matchUsers.find(id => id !== userId);

    const [requester, other] = await Promise.all([
      User.findById(userId).select('privacySettings.shareLocationWithRoommates'),
      User.findById(otherUserId).select('firstName lastName profilePhoto location lastSeen privacySettings.shareLocationWithRoommates'),
    ]);

    if (!requester?.privacySettings?.shareLocationWithRoommates) {
      throw new Error('Enable location sharing in your privacy settings first');
    }

    if (!other?.privacySettings?.shareLocationWithRoommates) {
      return { sharing: false, message: `${other?.firstName} hasn't enabled location sharing` };
    }

    return {
      sharing: true,
      user: {
        _id: other._id,
        firstName: other.firstName,
        lastName: other.lastName,
        profilePhoto: other.profilePhoto,
        location: other.location,
        lastSeen: other.lastSeen,
      },
    };
  }

  /**
   * Get matched user's emergency contacts (1-on-1)
   */
  async getMatchEmergencyContacts(matchId: string, userId: string) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(userId)) throw new Error('Not part of this match');

    const users = await User.find({ _id: { $in: matchUsers } })
      .select('firstName lastName profilePhoto emergencyContacts');

    return users.map((u: any) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePhoto: u.profilePhoto,
      emergencyContacts: u.emergencyContacts || [],
    }));
  }

  /**
   * Get matched user's personality info (1-on-1)
   */
  async getMatchPersonalityBoard(matchId: string, userId: string) {
    const match = await Match.findById(matchId);
    if (!match) throw new Error('Match not found');

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(userId)) throw new Error('Not part of this match');

    const users = await User.find({ _id: { $in: matchUsers } })
      .select('firstName lastName profilePhoto zodiacSign personalityType lifestyle interests dateOfBirth');

    return users.map((u: any) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePhoto: u.profilePhoto,
      zodiacSign: u.zodiacSign,
      personalityType: u.personalityType,
      lifestyle: u.lifestyle,
      interests: u.interests || [],
      dateOfBirth: u.dateOfBirth,
    }));
  }
}

export default new RoommateSettingsService();
