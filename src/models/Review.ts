import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewCategories {
  communication?: number;
  cleanliness?: number;
  reliability?: number;
  respectfulness?: number;
}

export interface IReviewDocument extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  rentalAgreement: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  role: 'landlord' | 'tenant';
  rating: number;
  comment?: string;
  categories: IReviewCategories;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rentalAgreement: { type: Schema.Types.ObjectId, ref: 'RentalAgreement', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
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
  },
  { timestamps: true }
);

reviewSchema.index({ reviewer: 1, rentalAgreement: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, isVisible: 1 });
reviewSchema.index({ property: 1, isVisible: 1 });

export const Review = mongoose.model<IReviewDocument>('Review', reviewSchema);

// ── Roommate Review (peer-to-peer, match-based) ──────────────────────────

export interface IRoommateReviewCategories {
  cleanliness?: number;
  communication?: number;
  reliability?: number;
  respectfulness?: number;
  noiseLevel?: number;
}

export interface IRoommateReviewDocument extends Document {
  reviewer: mongoose.Types.ObjectId;
  reviewee: mongoose.Types.ObjectId;
  match?: mongoose.Types.ObjectId;
  roommateGroup?: mongoose.Types.ObjectId;
  overallRating: number;
  categories: IRoommateReviewCategories;
  comment?: string;
  wouldRecommend?: boolean;
  livedTogetherMonths?: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roommateReviewSchema = new Schema<IRoommateReviewDocument>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match' },
    roommateGroup: { type: Schema.Types.ObjectId, ref: 'RoommateGroup' },
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
  },
  { timestamps: true }
);

roommateReviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });
roommateReviewSchema.index({ reviewee: 1, isVisible: 1 });

export const RoommateReview = mongoose.model<IRoommateReviewDocument>('RoommateReview', roommateReviewSchema);
