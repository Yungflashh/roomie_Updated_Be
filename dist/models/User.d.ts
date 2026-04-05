import mongoose, { Document } from 'mongoose';
export interface ISocialLink {
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
    username: string;
    url: string;
    connected: boolean;
    connectedAt?: Date;
    profileId?: string;
    accessToken?: string;
    refreshToken?: string;
    profilePhoto?: string;
}
export interface IUserDocument extends Document {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    phoneNumber?: string;
    profilePhoto?: string;
    photos: string[];
    bio?: string;
    occupation?: string;
    zodiacSign?: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
    personalityType?: 'intj' | 'intp' | 'entj' | 'entp' | 'infj' | 'infp' | 'enfj' | 'enfp' | 'istj' | 'isfj' | 'estj' | 'esfj' | 'istp' | 'isfp' | 'estp' | 'esfp';
    emergencyContacts: Array<{
        name: string;
        phone: string;
        relationship: string;
    }>;
    pointsUsername?: string;
    referralCode?: string;
    referredBy?: string;
    referralCount: number;
    location: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    preferences: {
        budget: {
            min: number;
            max: number;
            currency: string;
        };
        moveInDate?: Date;
        leaseDuration?: number;
        roomType: 'private' | 'shared' | 'any';
        gender?: 'male' | 'female' | 'any';
        ageRange?: {
            min: number;
            max: number;
        };
        petFriendly?: boolean;
        smoking?: boolean;
    };
    lifestyle: {
        sleepSchedule?: 'early-bird' | 'night-owl' | 'flexible';
        cleanliness?: 1 | 2 | 3 | 4 | 5;
        socialLevel?: 1 | 2 | 3 | 4 | 5;
        guestFrequency?: 'never' | 'rarely' | 'sometimes' | 'often';
        workFromHome?: boolean;
    };
    interests: string[];
    languages: string[];
    socialLinks: ISocialLink[];
    verified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    provider: 'email' | 'google' | 'apple';
    providerId?: string;
    fcmToken?: string;
    refreshToken?: string;
    emailVerificationCode?: string;
    emailVerificationExpires?: Date;
    passwordResetCode?: string;
    passwordResetExpires?: Date;
    subscription: {
        plan: 'free' | 'premium' | 'pro';
        startDate?: Date;
        endDate?: Date;
        autoRenew: boolean;
    };
    gamification: {
        points: number;
        level: number;
        badges: string[];
        achievements: string[];
        streak: number;
        lastActiveDate?: Date;
    };
    ownedCosmetics: string[];
    equippedCosmetics: {
        profileFrame?: string;
        chatBubble?: string;
        badge?: string;
        nameEffect?: string;
    };
    likes: string[];
    passes: string[];
    blockedUsers: string[];
    reportedBy: string[];
    lastRewind?: mongoose.Types.ObjectId;
    metadata?: {
        dailySwipeCount?: number;
        lastSwipeDate?: string;
        lastBoostAt?: Date;
        profileVisitors?: Array<{
            userId: mongoose.Types.ObjectId;
            visitedAt: Date;
        }>;
        monthlyInquiryCount?: number;
        lastInquiryMonth?: string;
        lastSwipeAction?: 'like' | 'pass' | null;
        lastSwipedUserId?: string | null;
        verificationRequested?: boolean;
        verificationRequestedAt?: Date;
        verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
        verificationRejectionReason?: string;
        kycDocuments?: {
            documentType?: string;
            idFrontPhoto?: string;
            idBackPhoto?: string;
            selfiePhoto?: string;
            submittedAt?: Date;
        };
    };
    isActive: boolean;
    moderation: {
        status: 'active' | 'suspended' | 'banned' | 'restricted';
        reason?: string;
        suspendedUntil?: Date;
        restrictedAt?: Date;
        moderatedBy?: string;
        history: Array<{
            action: string;
            reason?: string;
            duration?: string;
            by?: string;
            at: Date;
        }>;
    };
    lastSeen?: Date;
    notificationSettings: {
        pushEnabled: boolean;
        messages: boolean;
        matches: boolean;
        gameInvitations: boolean;
        dailyBonus: boolean;
        roommateActivity: boolean;
        inAppNotifications: boolean;
        inAppSound: boolean;
        inAppVibration: boolean;
    };
    privacySettings: {
        showOnlineStatus: boolean;
        showLastSeen: boolean;
        profileVisibility: 'everyone' | 'matches_only';
        readReceipts: boolean;
        shareLocationWithRoommates: boolean;
    };
    isProfileComplete: boolean;
    profileCompletionPercentage: number;
    missingProfileFields: string[];
    age?: number;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getProfileCompletion(): {
        isComplete: boolean;
        percentage: number;
        missingFields: string[];
        completedFields: string[];
    };
}
export declare const User: mongoose.Model<IUserDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserDocument, {}, mongoose.DefaultSchemaOptions> & IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUserDocument>;
//# sourceMappingURL=User.d.ts.map