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
exports.MovingOutListing = void 0;
// src/models/MovingOutListing.ts
const mongoose_1 = __importStar(require("mongoose"));
const movingOutListingSchema = new mongoose_1.Schema({
    mover: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'active', 'in_deal', 'completed', 'cancelled', 'rejected'],
        default: 'pending_review',
        index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },
    apartmentType: {
        type: String,
        enum: ['self_contain', 'room_parlour', '1_bedroom', '2_bedroom', '3_bedroom', 'duplex', 'other'],
        required: true,
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    address: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        city: { type: String, required: true, index: true },
        state: { type: String, required: true, index: true },
        country: { type: String, default: 'Nigeria' },
        neighborhood: String,
    },
    photos: { type: [String], default: [] },
    videoTour: String,
    monthlyRent: { type: Number, required: true, min: 0 },
    annualRent: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    referralFee: { type: Number, required: true, min: 0 },
    estimatedLegalFee: { type: Number, default: 0, min: 0 },
    estimatedCautionDeposit: { type: Number, default: 0, min: 0 },
    estimatedAgencyFee: { type: Number, default: 0, min: 0 },
    moveOutDate: { type: Date, required: true },
    availableFrom: { type: Date, required: true },
    monthsRemaining: { type: Number, default: 0, min: 0 },
    reasonForLeaving: { type: String, required: true, maxlength: 300 },
    landlordName: { type: String, required: true },
    landlordContact: String,
    landlordConsentStatus: {
        type: String,
        enum: ['not_asked', 'verbal_agreement', 'written_consent'],
        default: 'not_asked',
    },
    leaseAgreementDocument: String,
    landlordConsentDocument: String,
    amenities: { type: [String], default: [] },
    houseRules: { type: [String], default: [] },
    furnished: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    utilitiesIncluded: { type: Boolean, default: false },
    parkingAvailable: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    rejectionReason: String,
}, { timestamps: true });
// Indexes
movingOutListingSchema.index({ 'location.coordinates': '2dsphere' });
movingOutListingSchema.index({ status: 1, createdAt: -1 });
movingOutListingSchema.index({ mover: 1, status: 1 });
movingOutListingSchema.index({ 'location.city': 1, status: 1 });
movingOutListingSchema.index({ monthlyRent: 1 });
movingOutListingSchema.index({ availableFrom: 1 });
exports.MovingOutListing = mongoose_1.default.model('MovingOutListing', movingOutListingSchema);
//# sourceMappingURL=MovingOutListing.js.map