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
exports.SharedListing = void 0;
// src/models/SharedListing.ts
const mongoose_1 = __importStar(require("mongoose"));
const listingVoteSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vote: {
        type: String,
        enum: ['like', 'dislike', 'maybe'],
        required: true,
    },
    comment: String,
    votedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const listingNoteSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: true });
const sharedListingSchema = new mongoose_1.Schema({
    connection: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'RoommateConnection',
        required: true,
        index: true,
    },
    property: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Property',
    },
    addedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    externalUrl: String,
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    address: String,
    city: String,
    state: String,
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'NGN',
    },
    bedrooms: Number,
    bathrooms: Number,
    photos: [{
            type: String,
        }],
    amenities: [{
            type: String,
        }],
    description: {
        type: String,
        maxlength: 2000,
    },
    votes: [listingVoteSchema],
    notes: [listingNoteSchema],
    pros: [{
            type: String,
            maxlength: 200,
        }],
    cons: [{
            type: String,
            maxlength: 200,
        }],
    status: {
        type: String,
        enum: ['saved', 'viewing_scheduled', 'applied', 'rejected', 'accepted'],
        default: 'saved',
    },
    viewingDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Indexes
sharedListingSchema.index({ connection: 1, isArchived: 1, createdAt: -1 });
sharedListingSchema.index({ connection: 1, status: 1 });
sharedListingSchema.index({ connection: 1, priority: 1 });
// Virtual for match score (both users like it)
sharedListingSchema.virtual('matchScore').get(function () {
    const likes = this.votes.filter(v => v.vote === 'like').length;
    const total = this.votes.length;
    if (total === 0)
        return 0;
    return Math.round((likes / total) * 100);
});
// Virtual to check if both users voted
sharedListingSchema.virtual('hasConsensus').get(function () {
    if (this.votes.length < 2)
        return false;
    const allLike = this.votes.every(v => v.vote === 'like');
    const allDislike = this.votes.every(v => v.vote === 'dislike');
    return allLike || allDislike;
});
sharedListingSchema.set('toJSON', { virtuals: true });
sharedListingSchema.set('toObject', { virtuals: true });
exports.SharedListing = mongoose_1.default.model('SharedListing', sharedListingSchema);
//# sourceMappingURL=SharedListing.js.map