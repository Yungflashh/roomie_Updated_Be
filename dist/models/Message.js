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
exports.Message = void 0;
// src/models/Message.ts
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    match: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'file', 'game_invite', 'game_result', 'system'],
        default: 'text',
    },
    content: {
        type: String,
        maxlength: 5000,
    },
    mediaUrl: String,
    thumbnail: String,
    duration: Number,
    fileSize: Number,
    fileName: String,
    read: {
        type: Boolean,
        default: false,
    },
    readAt: Date,
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
    deletedFor: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    reactions: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            emoji: String,
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }],
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
    gameData: {
        sessionId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'GameSession',
        },
        gameId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Game',
        },
        gameName: String,
        gameThumbnail: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'expired'],
        },
        winnerId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        winnerName: String,
    },
    systemData: {
        action: String,
        relatedId: String,
        metadata: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
// Indexes
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ 'gameData.sessionId': 1 });
// Virtual for id
messageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
messageSchema.set('toJSON', {
    virtuals: true,
});
exports.Message = mongoose_1.default.model('Message', messageSchema);
//# sourceMappingURL=Message.js.map