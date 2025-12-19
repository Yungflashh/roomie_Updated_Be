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
        maxlength: 8,
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
}, {
    timestamps: true,
});
// Indexes
roommateGroupSchema.index({ inviteCode: 1 }, { unique: true });
roommateGroupSchema.index({ 'members.user': 1 });
roommateGroupSchema.index({ createdBy: 1 });
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
// Generate unique invite code
roommateGroupSchema.statics.generateInviteCode = async function () {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
    let code;
    let exists = true;
    while (exists) {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        exists = await this.findOne({ inviteCode: code }) !== null;
    }
    return code;
};
exports.RoommateGroup = mongoose_1.default.model('RoommateGroup', roommateGroupSchema);
//# sourceMappingURL=RoommateGroup.js.map