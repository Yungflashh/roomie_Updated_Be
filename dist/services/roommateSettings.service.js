"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
class RoommateSettingsService {
    /**
     * Update group feature toggles (admin only)
     */
    async updateGroupFeatures(groupId, userId, features) {
        const group = await models_1.RoommateGroup.findById(groupId);
        if (!group)
            throw new Error('Group not found');
        const member = group.members.find((m) => m.user.toString() === userId && m.status === 'active');
        if (!member || member.role !== 'admin') {
            throw new Error('Only admins can update group features');
        }
        if (features.locationSharing !== undefined)
            group.features.locationSharing = features.locationSharing;
        if (features.emergencyAlerts !== undefined)
            group.features.emergencyAlerts = features.emergencyAlerts;
        if (features.personalityBoard !== undefined)
            group.features.personalityBoard = features.personalityBoard;
        await group.save();
        return group;
    }
    /**
     * Get roommate locations (only if group has locationSharing enabled AND user has it enabled in privacy)
     */
    async getRoommateLocations(groupId, userId) {
        const group = await models_1.RoommateGroup.findById(groupId);
        if (!group)
            throw new Error('Group not found');
        const member = group.members.find((m) => m.user.toString() === userId && m.status === 'active');
        if (!member)
            throw new Error('Not a member of this group');
        if (!group.features.locationSharing) {
            throw new Error('Location sharing is not enabled for this group');
        }
        const activeMembers = group.members
            .filter((m) => m.status === 'active')
            .map((m) => m.user);
        const users = await models_1.User.find({
            _id: { $in: activeMembers },
            'privacySettings.shareLocationWithRoommates': true,
        }).select('firstName lastName profilePhoto location.coordinates location.city lastSeen');
        return users.map((u) => ({
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
    async getGroupEmergencyContacts(groupId, userId) {
        const group = await models_1.RoommateGroup.findById(groupId);
        if (!group)
            throw new Error('Group not found');
        const member = group.members.find((m) => m.user.toString() === userId && m.status === 'active');
        if (!member)
            throw new Error('Not a member of this group');
        if (!group.features.emergencyAlerts) {
            throw new Error('Emergency alerts are not enabled for this group');
        }
        const activeMembers = group.members
            .filter((m) => m.status === 'active')
            .map((m) => m.user);
        const users = await models_1.User.find({ _id: { $in: activeMembers } })
            .select('firstName lastName profilePhoto emergencyContacts');
        return users.map((u) => ({
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
    async getGroupPersonalityBoard(groupId, userId) {
        const group = await models_1.RoommateGroup.findById(groupId);
        if (!group)
            throw new Error('Group not found');
        const member = group.members.find((m) => m.user.toString() === userId && m.status === 'active');
        if (!member)
            throw new Error('Not a member of this group');
        const activeMembers = group.members
            .filter((m) => m.status === 'active')
            .map((m) => m.user);
        const users = await models_1.User.find({ _id: { $in: activeMembers } })
            .select('firstName lastName profilePhoto zodiacSign personalityType lifestyle interests dateOfBirth');
        return users.map((u) => ({
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
    async updateEmergencyContacts(userId, contacts) {
        if (contacts.length > 3)
            throw new Error('Maximum 3 emergency contacts allowed');
        const user = await models_1.User.findByIdAndUpdate(userId, { emergencyContacts: contacts }, { new: true }).select('emergencyContacts');
        return user?.emergencyContacts || [];
    }
    /**
     * Update user zodiac & personality
     */
    async updatePersonalityInfo(userId, data) {
        const update = {};
        if (data.zodiacSign)
            update.zodiacSign = data.zodiacSign;
        if (data.personalityType)
            update.personalityType = data.personalityType;
        const user = await models_1.User.findByIdAndUpdate(userId, update, { new: true })
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
    async getMatchLocation(matchId, userId) {
        const match = await models_1.Match.findById(matchId);
        if (!match)
            throw new Error('Match not found');
        const matchUsers = [match.user1.toString(), match.user2.toString()];
        if (!matchUsers.includes(userId))
            throw new Error('Not part of this match');
        const otherUserId = matchUsers.find(id => id !== userId);
        const [requester, other] = await Promise.all([
            models_1.User.findById(userId).select('privacySettings.shareLocationWithRoommates'),
            models_1.User.findById(otherUserId).select('firstName lastName profilePhoto location lastSeen privacySettings.shareLocationWithRoommates'),
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
    async getMatchEmergencyContacts(matchId, userId) {
        const match = await models_1.Match.findById(matchId);
        if (!match)
            throw new Error('Match not found');
        const matchUsers = [match.user1.toString(), match.user2.toString()];
        if (!matchUsers.includes(userId))
            throw new Error('Not part of this match');
        const users = await models_1.User.find({ _id: { $in: matchUsers } })
            .select('firstName lastName profilePhoto emergencyContacts');
        return users.map((u) => ({
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
    async getMatchPersonalityBoard(matchId, userId) {
        const match = await models_1.Match.findById(matchId);
        if (!match)
            throw new Error('Match not found');
        const matchUsers = [match.user1.toString(), match.user2.toString()];
        if (!matchUsers.includes(userId))
            throw new Error('Not part of this match');
        const users = await models_1.User.find({ _id: { $in: matchUsers } })
            .select('firstName lastName profilePhoto zodiacSign personalityType lifestyle interests dateOfBirth');
        return users.map((u) => ({
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
exports.default = new RoommateSettingsService();
//# sourceMappingURL=roommateSettings.service.js.map