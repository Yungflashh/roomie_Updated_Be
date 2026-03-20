import mongoose, { Schema, Document } from 'mongoose';

export interface IEventDocument extends Document {
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    city?: string;
    state?: string;
  };
  date: Date;
  endDate?: Date;
  category: string;
  coverImage?: string;
  media?: string[];
  creator: mongoose.Types.ObjectId;
  attendees: Array<{
    user: mongoose.Types.ObjectId;
    status: 'going' | 'interested' | 'not_going';
    respondedAt: Date;
  }>;
  maxAttendees?: number;
  isFree: boolean;
  price?: number;
  currency?: string;
  views: number;
  likes: mongoose.Types.ObjectId[];
  isActive: boolean;
  isCancelled: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEventDocument>({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true },
    city: String,
    state: String,
  },
  date: { type: Date, required: true },
  endDate: Date,
  category: { type: String, enum: ['study-group', 'house-party', 'movie-night', 'sports', 'food-drinks', 'networking', 'outdoor', 'gaming', 'other'], required: true },
  coverImage: String,
  media: { type: [String], default: [] },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['going', 'interested', 'not_going'], required: true },
    respondedAt: { type: Date, default: Date.now },
  }],
  maxAttendees: Number,
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'NGN' },
  views: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  isCancelled: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ creator: 1 });
eventSchema.index({ date: 1, isActive: 1 });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ 'attendees.user': 1 });

export const Event = mongoose.model<IEventDocument>('Event', eventSchema);
