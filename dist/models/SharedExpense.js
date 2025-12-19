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
exports.SharedExpense = void 0;
// src/models/SharedExpense.ts
const mongoose_1 = __importStar(require("mongoose"));
const expenseParticipantSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    share: {
        type: Number,
        required: true,
        min: 0,
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100,
    },
    paid: {
        type: Boolean,
        default: false,
    },
    paidAt: Date,
    markedPaidAt: Date,
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: Date,
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending_verification', 'verified', 'disputed'],
        default: 'unpaid',
    },
    paymentProof: String,
    paymentNote: String,
}, { _id: true });
const sharedExpenseSchema = new mongoose_1.Schema({
    group: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoommateGroup',
        required: true,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        maxlength: 500,
    },
    category: {
        type: String,
        enum: ['rent', 'utilities', 'groceries', 'internet', 'cleaning', 'furniture', 'transport', 'entertainment', 'other'],
        default: 'other',
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    splitType: {
        type: String,
        enum: ['equal', 'percentage', 'custom', 'shares'],
        default: 'equal',
    },
    splitAmong: {
        type: String,
        enum: ['all', 'selected'],
        default: 'all',
    },
    participants: [expenseParticipantSchema],
    paidBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dueDate: Date,
    recurring: {
        enabled: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['weekly', 'biweekly', 'monthly', 'yearly'],
        },
        nextDueDate: Date,
    },
    receipt: String,
    attachments: [String],
    status: {
        type: String,
        enum: ['pending', 'partial', 'settled'],
        default: 'pending',
    },
    settledAt: Date,
}, {
    timestamps: true,
});
// Indexes
sharedExpenseSchema.index({ group: 1, createdAt: -1 });
sharedExpenseSchema.index({ group: 1, status: 1 });
sharedExpenseSchema.index({ 'participants.user': 1 });
sharedExpenseSchema.index({ paidBy: 1 });
// Virtual for checking if fully settled
sharedExpenseSchema.virtual('isSettled').get(function () {
    return this.participants.every(p => p.paymentStatus === 'verified');
});
// Virtual for pending amount
sharedExpenseSchema.virtual('pendingAmount').get(function () {
    return this.participants
        .filter(p => p.paymentStatus !== 'verified')
        .reduce((sum, p) => sum + p.share, 0);
});
sharedExpenseSchema.set('toJSON', { virtuals: true });
sharedExpenseSchema.set('toObject', { virtuals: true });
exports.SharedExpense = mongoose_1.default.model('SharedExpense', sharedExpenseSchema);
//# sourceMappingURL=SharedExpense.js.map