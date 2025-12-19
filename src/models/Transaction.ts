// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: 'subscription' | 'feature' | 'boost' | 'coins';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'paystack';
  providerReference: string;
  providerMetadata?: any;
  plan?: string;
  description?: string;
  metadata?: any;
}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['subscription', 'feature', 'boost', 'coins'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: {
      type: String,
      enum: ['paystack'],
      default: 'paystack',
    },
    providerReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerMetadata: Schema.Types.Mixed,
    plan: String,
    description: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

export interface INotificationDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: 'match' | 'message' | 'like' | 'request' | 'request_accepted' | 'listing_like' | 'listing_view' | 'challenge' | 'achievement' | 'system' | 'reminder' | 'location_nearby';
  title: string;
  body: string;
  data?: {
    userId?: string;
    matchId?: string;
    listingId?: string;
    messageId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  image?: string;
  read: boolean;
  readAt?: Date;
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['match', 'message', 'like', 'request', 'request_accepted', 'listing_like', 'listing_view', 'challenge', 'achievement', 'system', 'reminder', 'location_nearby'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: Schema.Types.Mixed,
    image: String,
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    sent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);