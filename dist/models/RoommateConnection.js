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
exports.RoommateConnection = void 0;
// src/models/RoommateConnection.ts
const mongoose_1 = __importStar(require("mongoose"));
const roommateConnectionSchema = new mongoose_1.Schema({
    match: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true,
    },
    requester: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'cancelled'],
        default: 'pending',
        index: true,
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: {
        type: Date,
    },
    connectedAt: {
        type: Date,
    },
    features: {
        sharedExpenses: { type: Boolean, default: false },
        sharedCalendar: { type: Boolean, default: false },
        roommateAgreement: { type: Boolean, default: false },
        choreManagement: { type: Boolean, default: false },
        sharedListings: { type: Boolean, default: false },
    },
    metadata: {
        requestMessage: { type: String, maxlength: 500 },
        declineReason: { type: String, maxlength: 500 },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound index to ensure only one connection per match
roommateConnectionSchema.index({ match: 1 }, { unique: true });
// Index for finding connections by users
roommateConnectionSchema.index({ requester: 1, status: 1 });
roommateConnectionSchema.index({ recipient: 1, status: 1 });
// Virtual to check if connection is active
roommateConnectionSchema.virtual('isActive').get(function () {
    return this.status === 'accepted';
});
exports.RoommateConnection = mongoose_1.default.model('RoommateConnection', roommateConnectionSchema);
//# sourceMappingURL=RoommateConnection.js.map