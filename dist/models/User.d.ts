import mongoose, { Document } from 'mongoose';
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
    verified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    idVerified: boolean;
    provider: 'email' | 'google' | 'apple';
    providerId?: string;
    fcmToken?: string;
    refreshToken?: string;
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
    likes: string[];
    passes: string[];
    blockedUsers: string[];
    reportedBy: string[];
    isActive: boolean;
    lastSeen?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUserDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserDocument, {}, mongoose.DefaultSchemaOptions> & IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IUserDocument>;
//# sourceMappingURL=User.d.ts.map