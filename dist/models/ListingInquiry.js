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
exports.ListingInquiry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const viewingSchema = new mongoose_1.Schema({
    requestedDate: Date,
    requestedTime: String,
    confirmedDate: Date,
    confirmedTime: String,
    notes: String,
    status: {
        type: String,
        enum: ['none', 'pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
        default: 'none',
    },
}, { _id: false });
const offerSchema = new mongoose_1.Schema({
    price: Number,
    moveInDate: Date,
    leaseDuration: Number,
    message: String,
    respondedAt: Date,
    response: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'declined', 'countered'],
        default: 'none',
    },
}, { _id: false });
const statusChangeSchema = new mongoose_1.Schema({
    status: { type: String, required: true },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    note: String,
}, { _id: false });
const listingInquirySchema = new mongoose_1.Schema({
    seeker: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    lister: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Property', required: true },
    match: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Match', required: true },
    status: {
        type: String,
        enum: ['inquiry', 'viewing_requested', 'viewing_scheduled', 'viewed', 'offer_made', 'accepted', 'declined', 'withdrawn', 'expired'],
        default: 'inquiry',
    },
    viewing: { type: viewingSchema, default: () => ({ status: 'none' }) },
    offer: { type: offerSchema, default: () => ({ response: 'none' }) },
    statusHistory: [statusChangeSchema],
}, { timestamps: true });
listingInquirySchema.index({ seeker: 1, property: 1 }, { unique: true });
listingInquirySchema.index({ lister: 1, status: 1 });
listingInquirySchema.index({ seeker: 1, status: 1 });
listingInquirySchema.index({ property: 1 });
exports.ListingInquiry = mongoose_1.default.model('ListingInquiry', listingInquirySchema);
//# sourceMappingURL=ListingInquiry.js.map