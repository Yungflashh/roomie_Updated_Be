// src/models/RoommateAgreement.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRoommateAgreementParty {
  user: mongoose.Types.ObjectId;
  fullName: string;
  signedAt?: Date;
}

export interface IRoommateAgreement {
  match: mongoose.Types.ObjectId;
  party1: IRoommateAgreementParty;
  party2: IRoommateAgreementParty;
  status: 'pending' | 'signed' | 'active';
  moveInDate?: string;
  leaseEndDate?: string;
  rentAmount?: string;
  address?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoommateAgreementDocument extends IRoommateAgreement, Document {}

const partySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName: {
    type: String,
    default: '',
  },
  signedAt: Date,
}, { _id: false });

const roommateAgreementSchema = new Schema<IRoommateAgreementDocument>(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    party1: {
      type: partySchema,
      required: true,
    },
    party2: {
      type: partySchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'signed', 'active'],
      default: 'pending',
    },
    moveInDate: String,
    leaseEndDate: String,
    rentAmount: String,
    address: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One agreement per match
roommateAgreementSchema.index({ match: 1 }, { unique: true });
roommateAgreementSchema.index({ 'party1.user': 1 });
roommateAgreementSchema.index({ 'party2.user': 1 });

roommateAgreementSchema.set('toJSON', { virtuals: true });
roommateAgreementSchema.set('toObject', { virtuals: true });

export const RoommateAgreement = mongoose.model<IRoommateAgreementDocument>('RoommateAgreement', roommateAgreementSchema);
