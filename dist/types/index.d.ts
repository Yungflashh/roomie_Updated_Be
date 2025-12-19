import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
export interface IUser {
    _id: string;
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
    blockedUsers: string[];
    reportedBy: string[];
    isActive: boolean;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProperty {
    _id: string;
    landlord: string;
    title: string;
    description: string;
    type: 'apartment' | 'house' | 'condo' | 'room';
    price: number;
    currency: string;
    address: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
        city: string;
        state: string;
        country: string;
        zipCode?: string;
    };
    photos: string[];
    videos?: string[];
    amenities: string[];
    bedrooms: number;
    bathrooms: number;
    squareFeet?: number;
    availableFrom: Date;
    leaseDuration: number;
    petFriendly: boolean;
    smokingAllowed: boolean;
    utilitiesIncluded: boolean;
    furnished: boolean;
    parkingAvailable: boolean;
    status: 'available' | 'rented' | 'pending' | 'inactive';
    views: number;
    likes: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMatch {
    _id: string;
    user1: string;
    user2: string;
    compatibilityScore: number;
    matchedAt: Date;
    status: 'active' | 'expired' | 'blocked';
    lastMessageAt?: Date;
    unreadCount: {
        user1: number;
        user2: number;
    };
}
export interface IMessage {
    _id: string;
    match: string;
    sender: string;
    receiver: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    content?: string;
    mediaUrl?: string;
    mediaHash?: string;
    thumbnailUrl?: string;
    metadata?: {
        size?: number;
        duration?: number;
        dimensions?: {
            width: number;
            height: number;
        };
    };
    read: boolean;
    readAt?: Date;
    deleted: boolean;
    reactions: Array<{
        user: string;
        emoji: string;
    }>;
    createdAt: Date;
}
export interface IGame {
    _id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    minPlayers: number;
    maxPlayers: number;
    difficulty: 'easy' | 'medium' | 'hard';
    pointsReward: number;
    isActive: boolean;
}
export interface IGameSession {
    _id: string;
    game: string;
    players: Array<{
        user: string;
        score: number;
        rank: number;
    }>;
    winner?: string;
    startedAt: Date;
    endedAt?: Date;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
}
export interface IChallenge {
    _id: string;
    title: string;
    description: string;
    type: 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
    pointsReward: number;
    requirements: {
        action: string;
        target: number;
    }[];
    participants: Array<{
        user: string;
        progress: number;
        completed: boolean;
        completedAt?: Date;
    }>;
    isActive: boolean;
}
export interface ITransaction {
    _id: string;
    user: string;
    type: 'subscription' | 'feature' | 'boost';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    provider: 'paystack';
    providerReference: string;
    plan?: string;
    metadata?: any;
    createdAt: Date;
}
export interface IMediaHash {
    _id: string;
    user: string;
    originalFilename: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    hashes: {
        phash?: string;
        blockhash?: string;
        md5: string;
    };
    dimensions?: {
        width: number;
        height: number;
    };
    size: number;
    uploadedAt: Date;
}
export interface INotification {
    _id: string;
    user: string;
    type: 'match' | 'message' | 'like' | 'challenge' | 'achievement' | 'system';
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
    read: boolean;
    readAt?: Date;
    sent: boolean;
    sentAt?: Date;
    createdAt: Date;
}
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role?: string;
    };
}
export interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role?: string;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface LocationQuery {
    latitude: number;
    longitude: number;
    radius?: number;
}
export interface MatchFilters {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    budget?: {
        min: number;
        max: number;
    };
    location?: LocationQuery;
}
export type SocketEventType = 'user:online' | 'user:offline' | 'typing:start' | 'typing:stop' | 'message:new' | 'message:read' | 'match:new' | 'location:nearby';
//# sourceMappingURL=index.d.ts.map