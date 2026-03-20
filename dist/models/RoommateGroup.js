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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoommateGroup = void 0;
// src/models/RoommateGroup.ts
const mongoose_1 = __importStar(require("mongoose"));
const groupMemberSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member',
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
    invitedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['active', 'left', 'removed'],
        default: 'active',
    },
    leftAt: Date,
}, { _id: true });
const roommateGroupSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    description: {
        type: String,
        maxlength: 200,
    },
    coverImage: String,
    inviteCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        minlength: 6,
        maxlength: 10,
    },
    inviteLink: String,
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [groupMemberSchema],
    maxMembers: {
        type: Number,
        default: 10,
        min: 2,
        max: 20,
    },
    settings: {
        allowMemberInvites: {
            type: Boolean,
            default: true,
        },
        requireAdminApproval: {
            type: Boolean,
            default: false,
        },
        defaultSplitType: {
            type: String,
            enum: ['equal', 'custom'],
            default: 'equal',
        },
        currency: {
            type: String,
            default: 'NGN',
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    features: {
        locationSharing: { type: Boolean, default: false },
        emergencyAlerts: { type: Boolean, default: true },
        personalityBoard: { type: Boolean, default: true },
    },
}, {
    timestamps: true,
});
// Indexes
roommateGroupSchema.index({ inviteCode: 1 }, { unique: true });
roommateGroupSchema.index({ 'members.user': 1 });
roommateGroupSchema.index({ createdBy: 1 });
// Active group lookups
roommateGroupSchema.index({ 'members.user': 1, 'members.status': 1, isActive: 1 });
roommateGroupSchema.index({ isActive: 1 });
// Virtual: Get active members only
roommateGroupSchema.virtual('activeMembers').get(function () {
    return this.members.filter(m => m.status === 'active');
});
// Virtual: Count active members
roommateGroupSchema.virtual('memberCount').get(function () {
    return this.members.filter(m => m.status === 'active').length;
});
roommateGroupSchema.set('toJSON', { virtuals: true });
roommateGroupSchema.set('toObject', { virtuals: true });
/**
 * Generate unique invite code based on room name
 * Format: [PREFIX][NUMBERS] (e.g., "APT4523", "CRIB8234")
 * @param roomName - The name of the room
 * @returns A unique invite code
 */
roommateGroupSchema.statics.generateInviteCode = async function (roomName) {
    // Extract letters from room name and take first 3-4
    const letters = roomName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const prefix = letters.substring(0, Math.min(4, Math.max(3, letters.length)));
    // If no valid letters, use a default prefix
    const finalPrefix = prefix.length >= 3 ? prefix : 'ROOM';
    // Characters for numeric/alphanumeric suffix
    const numbers = '0123456789';
    const alphanumeric = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 50;
    while (exists && attempts < maxAttempts) {
        // Generate 4-digit number suffix
        let suffix = '';
        for (let i = 0; i < 4; i++) {
            suffix += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        code = finalPrefix + suffix;
        // Ensure code length is within bounds (6-10 characters)
        if (code.length < 6) {
            // Add extra random characters if too short
            const needed = 6 - code.length;
            for (let i = 0; i < needed; i++) {
                code += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
            }
        }
        else if (code.length > 10) {
            // Trim if too long (shouldn't happen with 4-letter prefix + 4 digits)
            code = code.substring(0, 10);
        }
        exists = await this.findOne({ inviteCode: code }) !== null;
        attempts++;
    }
    // Fallback: if all attempts failed, generate completely random code
    if (exists) {
        code = '';
        for (let i = 0; i < 8; i++) {
            code += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
        }
    }
    return code;
};
exports.RoommateGroup = mongoose_1.default.model('RoommateGroup', roommateGroupSchema);
//# sourceMappingURL=RoommateGroup.js.map