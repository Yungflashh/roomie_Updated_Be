// src/models/MovingOutListing.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IMovingOutListingDocument extends Document {
  mover: mongoose.Types.ObjectId;
  status: 'draft' | 'pending_review' | 'active' | 'in_deal' | 'completed' | 'cancelled' | 'rejected';

  // Property details
  title: string;
  description: string;
  apartmentType: 'self_contain' | 'room_parlour' | '1_bedroom' | '2_bedroom' | '3_bedroom' | 'duplex' | 'other';
  bedrooms: number;
  bathrooms: number;

  // Location
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city: string;
    state: string;
    country: string;
    neighborhood?: string;
  };

  // Media
  photos: string[];
  videoTour?: string;

  // Financial details
  monthlyRent: number;
  annualRent: number;
  currency: string; // default 'NGN'

  // The key differentiator — savings breakdown
  referralFee: number; // What the Mover charges the new tenant
  estimatedLegalFee: number; // What the landlord would typically charge
  estimatedCautionDeposit: number; // Refundable deposit
  estimatedAgencyFee: number; // What a traditional agent would charge (for savings calc)

  // Transition details
  moveOutDate: Date;
  availableFrom: Date;
  monthsRemaining: number; // on existing lease
  reasonForLeaving: string;

  // Landlord info (for transparency with Seeker)
  landlordName: string;
  landlordContact?: string;
  landlordConsentStatus: 'not_asked' | 'verbal_agreement' | 'written_consent';

  // Verification documents
  leaseAgreementDocument?: string; // URL to uploaded lease agreement
  landlordConsentDocument?: string; // optional

  // Property amenities
  amenities: string[];
  houseRules: string[];
  furnished: boolean;
  petFriendly: boolean;
  utilitiesIncluded: boolean;
  parkingAvailable: boolean;

  // Verification & engagement
  isVerified: boolean; // admin-verified listing
  verifiedAt?: Date;
  views: number;
  inquiries: number;

  // Cancellation/rejection reason
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const movingOutListingSchema = new Schema<IMovingOutListingDocument>(
  {
    mover: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

// Indexes
movingOutListingSchema.index({ 'location.coordinates': '2dsphere' });
movingOutListingSchema.index({ status: 1, createdAt: -1 });
movingOutListingSchema.index({ mover: 1, status: 1 });
movingOutListingSchema.index({ 'location.city': 1, status: 1 });
movingOutListingSchema.index({ monthlyRent: 1 });
movingOutListingSchema.index({ availableFrom: 1 });

export const MovingOutListing = mongoose.model<IMovingOutListingDocument>(
  'MovingOutListing',
  movingOutListingSchema
);
