"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src/models/User.ts - COMPLETE FILE WITH POINTS USERNAME
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Update the SocialLinkSchema
const SocialLinkSchema = new mongoose_1.Schema({
    platform: {
        type: String,
        enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    connected: {
        type: Boolean,
        default: true,
    },
    connectedAt: {
        type: Date,
        default: Date.now,
    },
    profileId: String,
    accessToken: {
        type: String,
        select: false,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    profilePhoto: String,
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        select: false,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    phoneNumber: String,
    profilePhoto: String,
    photos: {
        type: [String],
        default: [],
    },
    bio: String,
    occupation: String,
    // Points username - NEW FIELD
    pointsUsername: {
        type: String,
        unique: true,
        sparse: true, // Allow null but enforce uniqueness when set
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-z0-9_]+$/, // Only lowercase, numbers, underscores
        index: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
        address: String,
        city: String,
        state: String,
        country: String,
    },
    preferences: {
        budget: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 100000 },
            currency: { type: String, default: 'NGN' },
        },
        moveInDate: Date,
        leaseDuration: Number,
        roomType: {
            type: String,
            enum: ['private', 'shared', 'any'],
            default: 'any',
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'any'],
        },
        ageRange: {
            min: Number,
            max: Number,
        },
        petFriendly: Boolean,
        smoking: Boolean,
    },
    lifestyle: {
        sleepSchedule: {
            type: String,
            enum: ['early-bird', 'night-owl', 'flexible'],
        },
        cleanliness: {
            type: Number,
            min: 1,
            max: 5,
        },
        socialLevel: {
            type: Number,
            min: 1,
            max: 5,
        },
        guestFrequency: {
            type: String,
            enum: ['never', 'rarely', 'sometimes', 'often'],
        },
        workFromHome: Boolean,
    },
    interests: {
        type: [String],
        default: [],
    },
    languages: {
        type: [String],
        default: [],
    },
    socialLinks: {
        type: [SocialLinkSchema],
        default: [],
    },
    verified: {
        type: Boolean,
        default: false,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    phoneVerified: {
        type: Boolean,
        default: false,
    },
    idVerified: {
        type: Boolean,
        default: false,
    },
    provider: {
        type: String,
        enum: ['email', 'google', 'apple'],
        default: 'email',
    },
    providerId: String,
    fcmToken: String,
    refreshToken: {
        type: String,
        select: false,
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'premium', 'pro'],
            default: 'free',
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: false,
        },
    },
    gamification: {
        points: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
        },
        badges: {
            type: [String],
            default: [],
        },
        achievements: {
            type: [String],
            default: [],
        },
        streak: {
            type: Number,
            default: 0,
        },
        lastActiveDate: Date,
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    passes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    blockedUsers: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    reportedBy: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    isActive: {
        type: Boolean,
        default: true,
    },
    lastSeen: Date,
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            if (ret.password)
                delete ret.password;
            if (ret.refreshToken)
                delete ret.refreshToken;
            if (ret.__v)
                delete ret.__v;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
    },
});
function calculateProfileCompletion(user) {
    const fields = [
        // Required fields
        {
            name: 'firstName',
            label: 'First Name',
            weight: 10,
            check: (u) => !!u.firstName && u.firstName.trim().length > 0,
            required: true,
        },
        {
            name: 'lastName',
            label: 'Last Name',
            weight: 10,
            check: (u) => !!u.lastName && u.lastName.trim().length > 0,
            required: true,
        },
        {
            name: 'profilePhoto',
            label: 'Profile Photo',
            weight: 15,
            check: (u) => !!u.profilePhoto && u.profilePhoto.length > 0,
            required: true,
        },
        {
            name: 'dateOfBirth',
            label: 'Date of Birth',
            weight: 10,
            check: (u) => !!u.dateOfBirth,
            required: true,
        },
        {
            name: 'gender',
            label: 'Gender',
            weight: 5,
            check: (u) => !!u.gender,
            required: true,
        },
        {
            name: 'location',
            label: 'Location',
            weight: 10,
            check: (u) => !!(u.location?.city && u.location?.state),
            required: true,
        },
        {
            name: 'budget',
            label: 'Budget',
            weight: 10,
            check: (u) => !!(u.preferences?.budget?.min !== undefined && u.preferences?.budget?.max > 0),
            required: true,
        },
        // Optional fields
        {
            name: 'bio',
            label: 'Bio',
            weight: 5,
            check: (u) => !!u.bio && u.bio.trim().length >= 10,
            required: false,
        },
        {
            name: 'occupation',
            label: 'Occupation',
            weight: 5,
            check: (u) => !!u.occupation && u.occupation.trim().length > 0,
            required: false,
        },
        {
            name: 'interests',
            label: 'Interests',
            weight: 5,
            check: (u) => u.interests && u.interests.length >= 3,
            required: false,
        },
        {
            name: 'lifestyle',
            label: 'Lifestyle Preferences',
            weight: 5,
            check: (u) => !!(u.lifestyle?.sleepSchedule && u.lifestyle?.cleanliness && u.lifestyle?.guestFrequency),
            required: false,
        },
        {
            name: 'photos',
            label: 'Additional Photos',
            weight: 5,
            check: (u) => u.photos && u.photos.length >= 2,
            required: false,
        },
        {
            name: 'phoneNumber',
            label: 'Phone Number',
            weight: 5,
            check: (u) => !!u.phoneNumber && u.phoneNumber.length >= 10,
            required: false,
        },
    ];
    let totalWeight = 0;
    let completedWeight = 0;
    const missingFields = [];
    const completedFields = [];
    let allRequiredComplete = true;
    for (const field of fields) {
        totalWeight += field.weight;
        if (field.check(user)) {
            completedWeight += field.weight;
            completedFields.push(field.name);
        }
        else {
            missingFields.push(field.label);
            if (field.required) {
                allRequiredComplete = false;
            }
        }
    }
    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const isComplete = allRequiredComplete && percentage >= 70;
    return {
        isComplete,
        percentage,
        missingFields,
        completedFields,
    };
}
// =====================
// VIRTUAL FIELDS
// =====================
// Calculate age from dateOfBirth
userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth)
        return undefined;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});
// Profile completion check
userSchema.virtual('isProfileComplete').get(function () {
    const completion = calculateProfileCompletion(this);
    return completion.isComplete;
});
// Profile completion percentage
userSchema.virtual('profileCompletionPercentage').get(function () {
    const completion = calculateProfileCompletion(this);
    return completion.percentage;
});
// Missing profile fields
userSchema.virtual('missingProfileFields').get(function () {
    const completion = calculateProfileCompletion(this);
    return completion.missingFields;
});
// =====================
// METHODS
// =====================
// Get profile completion details (callable method)
userSchema.methods.getProfileCompletion = function () {
    return calculateProfileCompletion(this);
};
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// =====================
// INDEXES
// =====================
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ pointsUsername: 1 }); // NEW INDEX
userSchema.index({ isActive: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });
// =====================
// MIDDLEWARE
// =====================
// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
    }
    catch (error) {
        throw error;
    }
});
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map