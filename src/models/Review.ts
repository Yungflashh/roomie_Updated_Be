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
