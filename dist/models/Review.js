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
exports.RoommateReview = exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const reviewSchema = new mongoose_1.Schema({
    reviewer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    rentalAgreement: { type: mongoose_1.Schema.Types.ObjectId, ref: 'RentalAgreement', required: true },
    property: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Property', required: true },
    role: {
        type: String,
        enum: ['landlord', 'tenant'],
        required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    categories: {
        communication: { type: Number, min: 1, max: 5 },
        cleanliness: { type: Number, min: 1, max: 5 },
        reliability: { type: Number, min: 1, max: 5 },
        respectfulness: { type: Number, min: 1, max: 5 },
    },
    isVisible: { type: Boolean, default: true },
}, { timestamps: true });
reviewSchema.index({ reviewer: 1, rentalAgreement: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, isVisible: 1 });
reviewSchema.index({ property: 1, isVisible: 1 });
exports.Review = mongoose_1.default.model('Review', reviewSchema);
const roommateReviewSchema = new mongoose_1.Schema({
    reviewer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Match' },
    roommateGroup: { type: mongoose_1.Schema.Types.ObjectId, ref: 'RoommateGroup' },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    categories: {
        cleanliness: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        reliability: { type: Number, min: 1, max: 5 },
        respectfulness: { type: Number, min: 1, max: 5 },
        noiseLevel: { type: Number, min: 1, max: 5 },
    },
    comment: { type: String, maxlength: 500 },
    wouldRecommend: Boolean,
    livedTogetherMonths: Number,
    isVisible: { type: Boolean, default: true },
}, { timestamps: true });
roommateReviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });
roommateReviewSchema.index({ reviewee: 1, isVisible: 1 });
exports.RoommateReview = mongoose_1.default.model('RoommateReview', roommateReviewSchema);
//# sourceMappingURL=Review.js.map