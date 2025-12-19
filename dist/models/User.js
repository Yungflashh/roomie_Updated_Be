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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
            currency: { type: String, default: 'USD' },
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
});
// Indexes for performance
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });
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
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map