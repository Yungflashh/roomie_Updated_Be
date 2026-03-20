import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyDocument extends Document {
  landlord: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'condo' | 'room';
  price: number;
  currency: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    city: string;
    state: string;
    country: string;
    zipCode?: string;
  };
  photos: string[];
  videos?: string[];
  virtualTour?: {
    enabled: boolean;
    url?: string;
    photos360?: string[];
    floorPlanUrl?: string;
  };
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  availableFrom: Date;
  leaseDuration: number;
  petFriendly: boolean;
  smokingAllowed: boolean;
  utilitiesIncluded: boolean;
  furnished: boolean;
  parkingAvailable: boolean;
  status: 'available' | 'rented' | 'pending' | 'inactive';
  views: number;
  likes: mongoose.Types.ObjectId[];
  isVerified: boolean;
}

const propertySchema = new Schema<IPropertyDocument>(
  {
    landlord: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'room'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zipCode: String,
    },
    photos: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    virtualTour: {
      enabled: { type: Boolean, default: false },
      url: String,
      photos360: [String],
      floorPlanUrl: String,
    },
    amenities: {
      type: [String],
      default: [],
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
    },
    squareFeet: Number,
    availableFrom: {
      type: Date,
      required: true,
    },
    leaseDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    petFriendly: {
      type: Boolean,
      default: false,
    },
    smokingAllowed: {
      type: Boolean,
      default: false,
    },
    utilitiesIncluded: {
      type: Boolean,
      default: false,
    },
    furnished: {
      type: Boolean,
      default: false,
    },
    parkingAvailable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'pending', 'inactive'],
      default: 'pending',
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ landlord: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ createdAt: -1 });

// Property search filter indexes
propertySchema.index({ status: 1, price: 1, createdAt: -1 });
propertySchema.index({ status: 1, type: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ 'location.state': 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ bedrooms: 1 });
propertySchema.index({ bathrooms: 1 });
propertySchema.index({ petFriendly: 1 });
propertySchema.index({ furnished: 1 });

export const Property = mongoose.model<IPropertyDocument>('Property', propertySchema);
