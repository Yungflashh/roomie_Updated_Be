// src/models/GroupAgreement.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupAgreementSignatory {
  user: mongoose.Types.ObjectId;
  fullName: string;
  signedAt?: Date;
}

export interface IGroupAgreement {
  group: mongoose.Types.ObjectId;
  signatories: IGroupAgreementSignatory[];
  status: 'pending' | 'partial' | 'active';
  moveInDate?: string;
  leaseEndDate?: string;
  rentAmount?: string;
  address?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupAgreementDocument extends IGroupAgreement, Document {}

const signatorySchema = new Schema({
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

const groupAgreementSchema = new Schema<IGroupAgreementDocument>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
    },
    signatories: [signatorySchema],
    status: {
      type: String,
      enum: ['pending', 'partial', 'active'],
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

// One active agreement per group
groupAgreementSchema.index({ group: 1, status: 1 });
groupAgreementSchema.index({ group: 1, createdAt: -1 });

groupAgreementSchema.set('toJSON', { virtuals: true });
groupAgreementSchema.set('toObject', { virtuals: true });

export const GroupAgreement = mongoose.model<IGroupAgreementDocument>('GroupAgreement', groupAgreementSchema);
