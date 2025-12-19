// src/models/GroupInvite.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupInvite {
  group: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  invitedUser?: mongoose.Types.ObjectId; // If inviting specific user
  email?: string; // If inviting by email
  phone?: string; // If inviting by phone
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupInviteDocument extends IGroupInvite, Document {}

const groupInviteSchema = new Schema<IGroupInviteDocument>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: Date,
    declinedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
groupInviteSchema.index({ group: 1, status: 1 });
groupInviteSchema.index({ invitedUser: 1, status: 1 });
groupInviteSchema.index({ email: 1, status: 1 });
groupInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

groupInviteSchema.set('toJSON', { virtuals: true });
groupInviteSchema.set('toObject', { virtuals: true });

export const GroupInvite = mongoose.model<IGroupInviteDocument>('GroupInvite', groupInviteSchema);