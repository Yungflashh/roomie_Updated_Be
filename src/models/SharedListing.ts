// src/models/SharedListing.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IListingVote {
  user: mongoose.Types.ObjectId;
  vote: 'like' | 'dislike' | 'maybe';
  comment?: string;
  votedAt: Date;
}

export interface IListingNote {
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface ISharedListing {
  connection: mongoose.Types.ObjectId; // RoommateConnection reference
  property?: mongoose.Types.ObjectId; // Reference to Property model if internal
  addedBy: mongoose.Types.ObjectId;
  // External listing info (if not from our platform)
  externalUrl?: string;
  title: string;
  address?: string;
  city?: string;
  state?: string;
  price: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  photos: string[];
  amenities: string[];
  description?: string;
  // Collaboration features
  votes: IListingVote[];
  notes: IListingNote[];
  pros: string[];
  cons: string[];
  // Status
  status: 'saved' | 'viewing_scheduled' | 'applied' | 'rejected' | 'accepted';
  viewingDate?: Date;
  priority: 'low' | 'medium' | 'high';
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISharedListingDocument extends ISharedListing, Document {}

const listingVoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
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

const listingNoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
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

const sharedListingSchema = new Schema<ISharedListingDocument>(
  {
    connection: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateConnection',
      required: true,
      index: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
    },
    addedBy: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
sharedListingSchema.index({ connection: 1, isArchived: 1, createdAt: -1 });
sharedListingSchema.index({ connection: 1, status: 1 });
sharedListingSchema.index({ connection: 1, priority: 1 });

// Virtual for match score (both users like it)
sharedListingSchema.virtual('matchScore').get(function() {
  const likes = this.votes.filter(v => v.vote === 'like').length;
  const total = this.votes.length;
  if (total === 0) return 0;
  return Math.round((likes / total) * 100);
});

// Virtual to check if both users voted
sharedListingSchema.virtual('hasConsensus').get(function() {
  if (this.votes.length < 2) return false;
  const allLike = this.votes.every(v => v.vote === 'like');
  const allDislike = this.votes.every(v => v.vote === 'dislike');
  return allLike || allDislike;
});

sharedListingSchema.set('toJSON', { virtuals: true });
sharedListingSchema.set('toObject', { virtuals: true });

export const SharedListing = mongoose.model<ISharedListingDocument>('SharedListing', sharedListingSchema);