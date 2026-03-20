import mongoose, { Schema, Document } from 'mongoose';

export interface IConfessionDocument extends Document {
  group: mongoose.Types.ObjectId;
  content: string;
  category: 'funny' | 'serious' | 'rant' | 'appreciation' | 'confession' | 'question';
  reactions: Array<{ emoji: string; count: number; reactedHashes: string[] }>;
  replies: Array<{
    content: string;
    reactions: Array<{ emoji: string; count: number; reactedHashes: string[] }>;
    createdAt: Date;
  }>;
  reportCount: number;
  isHidden: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const confessionSchema = new Schema<IConfessionDocument>({
  group: { type: Schema.Types.ObjectId, ref: 'RoommateGroup', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  category: { type: String, enum: ['funny', 'serious', 'rant', 'appreciation', 'confession', 'question'], default: 'confession' },
  reactions: [{ emoji: String, count: { type: Number, default: 0 }, reactedHashes: [String] }],
  replies: [{
    content: { type: String, required: true, maxlength: 500 },
    reactions: [{ emoji: String, count: { type: Number, default: 0 }, reactedHashes: [String] }],
    createdAt: { type: Date, default: Date.now },
  }],
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

confessionSchema.index({ group: 1, isActive: 1, createdAt: -1 });
confessionSchema.index({ group: 1, category: 1 });

export const Confession = mongoose.model<IConfessionDocument>('Confession', confessionSchema);
