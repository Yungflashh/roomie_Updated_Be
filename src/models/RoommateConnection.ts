// src/models/RoommateConnection.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoommateConnectionDocument extends Document {
  match: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  requestedAt: Date;
  respondedAt?: Date;
  connectedAt?: Date;
  // Features unlocked after connection
  features: {
    sharedExpenses: boolean;
    sharedCalendar: boolean;
    roommateAgreement: boolean;
    choreManagement: boolean;
    sharedListings: boolean;
  };
  // Connection metadata
  metadata: {
    requestMessage?: string;
    declineReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const roommateConnectionSchema = new Schema<IRoommateConnectionDocument>(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    connectedAt: {
      type: Date,
    },
    features: {
      sharedExpenses: { type: Boolean, default: false },
      sharedCalendar: { type: Boolean, default: false },
      roommateAgreement: { type: Boolean, default: false },
      choreManagement: { type: Boolean, default: false },
      sharedListings: { type: Boolean, default: false },
    },
    metadata: {
      requestMessage: { type: String, maxlength: 500 },
      declineReason: { type: String, maxlength: 500 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure only one connection per match
roommateConnectionSchema.index({ match: 1 }, { unique: true });

// Index for finding connections by users
roommateConnectionSchema.index({ requester: 1, status: 1 });
roommateConnectionSchema.index({ recipient: 1, status: 1 });

// Virtual to check if connection is active
roommateConnectionSchema.virtual('isActive').get(function() {
  return this.status === 'accepted';
});

export const RoommateConnection = mongoose.model<IRoommateConnectionDocument>(
  'RoommateConnection',
  roommateConnectionSchema
);