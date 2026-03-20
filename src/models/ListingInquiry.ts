import mongoose, { Schema, Document } from 'mongoose';

export interface IViewingDetails {
  requestedDate?: Date;
  requestedTime?: string;
  confirmedDate?: Date;
  confirmedTime?: string;
  notes?: string;
  status: 'none' | 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
}

export interface IOffer {
  price?: number;
  moveInDate?: Date;
  leaseDuration?: number;
  message?: string;
  respondedAt?: Date;
  response: 'none' | 'pending' | 'accepted' | 'declined' | 'countered';
}

export interface IStatusChange {
  status: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IListingInquiryDocument extends Document {
  seeker: mongoose.Types.ObjectId;
  lister: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  match: mongoose.Types.ObjectId;
  status: 'inquiry' | 'viewing_requested' | 'viewing_scheduled' | 'viewed' | 'offer_made' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  viewing: IViewingDetails;
  offer: IOffer;
  statusHistory: IStatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

const viewingSchema = new Schema({
  requestedDate: Date,
  requestedTime: String,
  confirmedDate: Date,
  confirmedTime: String,
  notes: String,
  status: {
    type: String,
    enum: ['none', 'pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
    default: 'none',
  },
}, { _id: false });

const offerSchema = new Schema({
  price: Number,
  moveInDate: Date,
  leaseDuration: Number,
  message: String,
  respondedAt: Date,
  response: {
    type: String,
    enum: ['none', 'pending', 'accepted', 'declined', 'countered'],
    default: 'none',
  },
}, { _id: false });

const statusChangeSchema = new Schema({
  status: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
  note: String,
}, { _id: false });

const listingInquirySchema = new Schema<IListingInquiryDocument>(
  {
    seeker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lister: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    match: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    status: {
      type: String,
      enum: ['inquiry', 'viewing_requested', 'viewing_scheduled', 'viewed', 'offer_made', 'accepted', 'declined', 'withdrawn', 'expired'],
      default: 'inquiry',
    },
    viewing: { type: viewingSchema, default: () => ({ status: 'none' }) },
    offer: { type: offerSchema, default: () => ({ response: 'none' }) },
    statusHistory: [statusChangeSchema],
  },
  { timestamps: true }
);

listingInquirySchema.index({ seeker: 1, property: 1 }, { unique: true });
listingInquirySchema.index({ lister: 1, status: 1 });
listingInquirySchema.index({ seeker: 1, status: 1 });
listingInquirySchema.index({ property: 1 });

export const ListingInquiry = mongoose.model<IListingInquiryDocument>('ListingInquiry', listingInquirySchema);
