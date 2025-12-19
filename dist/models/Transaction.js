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
exports.Notification = exports.Transaction = void 0;
// src/models/Transaction.ts
const mongoose_1 = __importStar(require("mongoose"));
const transactionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['subscription', 'feature', 'boost', 'coins'],
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
        index: true,
    },
    provider: {
        type: String,
        enum: ['paystack'],
        default: 'paystack',
    },
    providerReference: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    providerMetadata: mongoose_1.Schema.Types.Mixed,
    plan: String,
    description: String,
    metadata: mongoose_1.Schema.Types.Mixed,
}, {
    timestamps: true,
});
// Indexes
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
const notificationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['match', 'message', 'like', 'request', 'request_accepted', 'listing_like', 'listing_view', 'challenge', 'achievement', 'system', 'reminder', 'location_nearby'],
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    data: mongoose_1.Schema.Types.Mixed,
    image: String,
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: Date,
    sent: {
        type: Boolean,
        default: false,
    },
    sentAt: Date,
}, {
    timestamps: true,
});
// Indexes
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
//# sourceMappingURL=Transaction.js.map