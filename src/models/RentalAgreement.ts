import mongoose, { Schema, Document } from 'mongoose';

export interface IRentalParty {
  user: mongoose.Types.ObjectId;
  fullName: string;
  signedAt?: Date;
}

export interface IRentalTerms {
  monthlyRent: number;
  currency: string;
  securityDeposit?: number;
  moveInDate: Date;
  leaseEndDate?: Date;
  leaseDuration: number;
  paymentDueDay?: number;
  utilitiesIncluded: boolean;
  additionalTerms?: string;
}

export interface IRentalAgreementDocument extends Document {
  inquiry: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  match: mongoose.Types.ObjectId;
  landlord: IRentalParty;
  tenant: IRentalParty;
  status: 'draft' | 'pending' | 'signed' | 'active' | 'terminated';
  terms: IRentalTerms;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, default: '' },
  signedAt: Date,
}, { _id: false });

const termsSchema = new Schema({
  monthlyRent: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  securityDeposit: Number,
  moveInDate: { type: Date, required: true },
  leaseEndDate: Date,
  leaseDuration: { type: Number, required: true },
  paymentDueDay: { type: Number, min: 1, max: 28 },
  utilitiesIncluded: { type: Boolean, default: false },
  additionalTerms: String,
}, { _id: false });

const rentalAgreementSchema = new Schema<IRentalAgreementDocument>(
  {
    inquiry: { type: Schema.Types.ObjectId, ref: 'ListingInquiry', required: true, unique: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    landlord: { type: partySchema, required: true },
    tenant: { type: partySchema, required: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'signed', 'active', 'terminated'],
      default: 'draft',
    },
    terms: { type: termsSchema, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

rentalAgreementSchema.index({ property: 1 });
rentalAgreementSchema.index({ 'landlord.user': 1 });
rentalAgreementSchema.index({ 'tenant.user': 1 });
rentalAgreementSchema.index({ status: 1 });

export const RentalAgreement = mongoose.model<IRentalAgreementDocument>('RentalAgreement', rentalAgreementSchema);
