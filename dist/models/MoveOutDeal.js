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
exports.MoveOutDeal = void 0;
// src/models/MoveOutDeal.ts
const mongoose_1 = __importStar(require("mongoose"));
const moveOutDealSchema = new mongoose_1.Schema({
    listing: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MovingOutListing',
        required: true,
        index: true,
    },
    mover: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    seeker: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: [
            'inquiry_sent',
            'inspection_scheduled',
            'inspection_done',
            'agreed',
            'payment_pending',
            'payment_escrowed',
            'moved_in',
            'dispute_open',
            'completed',
            'cancelled',
            'refunded',
        ],
        default: 'inquiry_sent',
        index: true,
    },
    referralFeeAmount: { type: Number, required: true, min: 0 },
    platformFeePercent: { type: Number, default: 10 },
    platformFeeAmount: { type: Number, required: true, min: 0 },
    netToMover: { type: Number, required: true, min: 0 },
    paystackReference: { type: String, index: true, sparse: true },
    paystackAuthorizationUrl: String,
    paymentChannel: String,
    paidAt: Date,
    payoutRecipientCode: String,
    payoutReference: String,
    payoutStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'reversed'],
    },
    payoutAt: Date,
    payoutFailureReason: String,
    moverBankDetails: {
        bankCode: String,
        bankName: String,
        accountNumber: String,
        accountName: String,
    },
    moveInConfirmedAt: Date,
    disputeWindowEndsAt: Date,
    disputeOpenedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    disputeOpenedAt: Date,
    disputeReason: String,
    disputeResolution: { type: String, enum: ['refunded', 'released', 'partial'] },
    disputeResolvedAt: Date,
    disputeNotes: String,
    cancelledBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancellationReason: String,
    timeline: [
        {
            event: { type: String, required: true },
            actor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            timestamp: { type: Date, default: Date.now },
            note: String,
            metadata: mongoose_1.Schema.Types.Mixed,
        },
    ],
    inspectionScheduledFor: Date,
    inspectionNotes: String,
}, { timestamps: true });
moveOutDealSchema.index({ mover: 1, status: 1 });
moveOutDealSchema.index({ seeker: 1, status: 1 });
moveOutDealSchema.index({ listing: 1, status: 1 });
moveOutDealSchema.index({ createdAt: -1 });
exports.MoveOutDeal = mongoose_1.default.model('MoveOutDeal', moveOutDealSchema);
//# sourceMappingURL=MoveOutDeal.js.map