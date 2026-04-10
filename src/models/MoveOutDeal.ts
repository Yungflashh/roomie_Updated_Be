// src/models/MoveOutDeal.ts
import mongoose, { Document, Schema } from 'mongoose';

export type DealStatus =
  | 'inquiry_sent' // Seeker has requested to take over the apartment
  | 'inspection_scheduled' // Mover agreed, they're scheduling a viewing
  | 'inspection_done' // Viewing happened
  | 'agreed' // Both sides verbally agreed to proceed
  | 'payment_pending' // Waiting for Seeker to pay the referral fee
  | 'payment_escrowed' // Payment received by Roomie, held in escrow
  | 'moved_in' // Seeker confirmed move-in
  | 'dispute_open' // Something went wrong, under review
  | 'completed' // Paid out to Mover, done
  | 'cancelled' // Deal cancelled before payment
  | 'refunded'; // Escrow refunded to Seeker

export interface IMoveOutDealDocument extends Document {
  listing: mongoose.Types.ObjectId;
  mover: mongoose.Types.ObjectId; // Outgoing tenant
  seeker: mongoose.Types.ObjectId; // Incoming tenant
  status: DealStatus;

  // Financials — in kobo (smallest unit — 1 NGN = 100 kobo)
  referralFeeAmount: number; // Total Seeker pays
  platformFeePercent: number; // e.g., 10 = 10%
  platformFeeAmount: number; // 10% of referral
  netToMover: number; // What Mover actually receives

  // Paystack payment tracking
  paystackReference?: string;
  paystackAuthorizationUrl?: string;
  paymentChannel?: string;
  paidAt?: Date;

  // Payout tracking (when we transfer to Mover)
  payoutRecipientCode?: string; // Paystack recipient code
  payoutReference?: string; // Paystack transfer reference
  payoutStatus?: 'pending' | 'success' | 'failed' | 'reversed';
  payoutAt?: Date;
  payoutFailureReason?: string;

  // Mover's bank details (collected during deal)
  moverBankDetails?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };

  // Move-in confirmation & dispute window
  moveInConfirmedAt?: Date;
  disputeWindowEndsAt?: Date; // 48 hours after move-in confirmation

  // Dispute details
  disputeOpenedBy?: mongoose.Types.ObjectId;
  disputeOpenedAt?: Date;
  disputeReason?: string;
  disputeResolution?: 'refunded' | 'released' | 'partial';
  disputeResolvedAt?: Date;
  disputeNotes?: string;

  // Cancellation
  cancelledBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Audit trail
  timeline: Array<{
    event: string;
    actor?: mongoose.Types.ObjectId;
    timestamp: Date;
    note?: string;
    metadata?: any;
  }>;

  // Inspection scheduling
  inspectionScheduledFor?: Date;
  inspectionNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const moveOutDealSchema = new Schema<IMoveOutDealDocument>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'MovingOutListing',
      required: true,
      index: true,
    },
    mover: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seeker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'inquiry_sent',
        'inspection_scheduled',
        'inspection_done',
        'agreed',
        'payment_pending',
        'payment_escrowed',
        'moved_in',
        'dispute_open',
        'completed',
        'cancelled',
        'refunded',
      ],
      default: 'inquiry_sent',
      index: true,
    },

    referralFeeAmount: { type: Number, required: true, min: 0 },
    platformFeePercent: { type: Number, default: 10 },
    platformFeeAmount: { type: Number, required: true, min: 0 },
    netToMover: { type: Number, required: true, min: 0 },

    paystackReference: { type: String, index: true, sparse: true },
    paystackAuthorizationUrl: String,
    paymentChannel: String,
    paidAt: Date,

    payoutRecipientCode: String,
    payoutReference: String,
    payoutStatus: {
      type: String,
      enum: ['pending', 'success', 'failed', 'reversed'],
    },
    payoutAt: Date,
    payoutFailureReason: String,

    moverBankDetails: {
      bankCode: String,
      bankName: String,
      accountNumber: String,
      accountName: String,
    },

    moveInConfirmedAt: Date,
    disputeWindowEndsAt: Date,

    disputeOpenedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disputeOpenedAt: Date,
    disputeReason: String,
    disputeResolution: { type: String, enum: ['refunded', 'released', 'partial'] },
    disputeResolvedAt: Date,
    disputeNotes: String,

    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancellationReason: String,

    timeline: [
      {
        event: { type: String, required: true },
        actor: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: String,
        metadata: Schema.Types.Mixed,
      },
    ],

    inspectionScheduledFor: Date,
    inspectionNotes: String,
  },
  { timestamps: true }
);

moveOutDealSchema.index({ mover: 1, status: 1 });
moveOutDealSchema.index({ seeker: 1, status: 1 });
moveOutDealSchema.index({ listing: 1, status: 1 });
moveOutDealSchema.index({ createdAt: -1 });

export const MoveOutDeal = mongoose.model<IMoveOutDealDocument>('MoveOutDeal', moveOutDealSchema);
