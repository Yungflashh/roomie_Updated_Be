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
exports.Chore = void 0;
// src/models/Chore.ts
const mongoose_1 = __importStar(require("mongoose"));
const choreAssignmentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: Date,
    status: {
        type: String,
        enum: ['pending', 'done', 'verified', 'skipped', 'disputed', 'transferred'],
        default: 'pending',
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: Date,
    transferredTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    transferredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    transferCost: Number,
    notes: String,
    proofImage: String,
}, { _id: true });
const choreSchema = new mongoose_1.Schema({
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
    icon: {
        type: String,
        default: '🧹',
    },
    category: {
        type: String,
        enum: ['cleaning', 'kitchen', 'bathroom', 'laundry', 'trash', 'shopping', 'pets', 'maintenance', 'other'],
        default: 'other',
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly', 'once'],
        default: 'weekly',
    },
    rotationType: {
        type: String,
        enum: ['rotate', 'fixed', 'volunteer', 'random'],
        default: 'rotate',
    },
    assignTo: {
        type: String,
        enum: ['all', 'selected'],
        default: 'all',
    },
    currentAssignee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    rotationOrder: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    currentRotationIndex: {
        type: Number,
        default: 0,
    },
    assignments: [choreAssignmentSchema],
    nextDueDate: Date,
    points: {
        type: Number,
        default: 10,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
choreSchema.index({ group: 1, isActive: 1 });
choreSchema.index({ currentAssignee: 1, nextDueDate: 1 });
choreSchema.index({ group: 1, category: 1 });
choreSchema.index({ 'participants': 1 });
choreSchema.set('toJSON', { virtuals: true });
choreSchema.set('toObject', { virtuals: true });
exports.Chore = mongoose_1.default.model('Chore', choreSchema);
//# sourceMappingURL=Chore.js.map