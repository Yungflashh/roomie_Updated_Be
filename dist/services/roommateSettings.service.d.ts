import mongoose from 'mongoose';
declare class RoommateSettingsService {
    /**
     * Update group feature toggles (admin only)
     */
    updateGroupFeatures(groupId: string, userId: string, features: {
        locationSharing?: boolean;
        emergencyAlerts?: boolean;
        personalityBoard?: boolean;
    }): Promise<mongoose.Document<unknown, {}, import("../models").IRoommateGroupDocument, {}, mongoose.DefaultSchemaOptions> & import("../models").IRoommateGroupDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get roommate locations (only if group has locationSharing enabled AND user has it enabled in privacy)
     */
    getRoommateLocations(groupId: string, userId: string): Promise<{
        _id: any;
        firstName: any;
        lastName: any;
        profilePhoto: any;
        location: any;
        lastSeen: any;
    }[]>;
    /**
     * Get emergency contacts for all group members
     */
    getGroupEmergencyContacts(groupId: string, userId: string): Promise<{
        _id: any;
        firstName: any;
        lastName: any;
        profilePhoto: any;
        emergencyContacts: any;
    }[]>;
    /**
     * Get personality board for all group members
     */
    getGroupPersonalityBoard(groupId: string, userId: string): Promise<{
        _id: any;
        firstName: any;
        lastName: any;
        profilePhoto: any;
        zodiacSign: any;
        personalityType: any;
        lifestyle: any;
        interests: any;
        dateOfBirth: any;
    }[]>;
    /**
     * Update user's emergency contacts
     */
    updateEmergencyContacts(userId: string, contacts: Array<{
        name: string;
        phone: string;
        relationship: string;
    }>): Promise<{
        name: string;
        phone: string;
        relationship: string;
    }[]>;
    /**
     * Update user zodiac & personality
     */
    updatePersonalityInfo(userId: string, data: {
        zodiacSign?: string;
        personalityType?: string;
    }): Promise<(mongoose.Document<unknown, {}, import("../models").IUserDocument, {}, mongoose.DefaultSchemaOptions> & import("../models").IUserDocument & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get matched user's location (1-on-1)
     * Both users must have shareLocationWithRoommates enabled
     */
    getMatchLocation(matchId: string, userId: string): Promise<{
        sharing: boolean;
        message: string;
        user?: undefined;
    } | {
        sharing: boolean;
        user: {
            _id: mongoose.Types.ObjectId;
            firstName: string;
            lastName: string;
            profilePhoto: string | undefined;
            location: {
                type: "Point";
                coordinates: [number, number];
                address?: string;
                city?: string;
                state?: string;
                country?: string;
            };
            lastSeen: Date | undefined;
        };
        message?: undefined;
    }>;
    /**
     * Get matched user's emergency contacts (1-on-1)
     */
    getMatchEmergencyContacts(matchId: string, userId: string): Promise<{
        _id: any;
        firstName: any;
        lastName: any;
        profilePhoto: any;
        emergencyContacts: any;
    }[]>;
    /**
     * Get matched user's personality info (1-on-1)
     */
    getMatchPersonalityBoard(matchId: string, userId: string): Promise<{
        _id: any;
        firstName: any;
        lastName: any;
        profilePhoto: any;
        zodiacSign: any;
        personalityType: any;
        lifestyle: any;
        interests: any;
        dateOfBirth: any;
    }[]>;
}
declare const _default: RoommateSettingsService;
export default _default;
//# sourceMappingURL=roommateSettings.service.d.ts.map