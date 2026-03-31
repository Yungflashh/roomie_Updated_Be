import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivityDocument extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  sessions: number;
  totalSeconds: number;
  lastSessionStart?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    sessions: { type: Number, default: 0 },
    totalSeconds: { type: Number, default: 0 },
    lastSessionStart: { type: Date },
  },
  { timestamps: true }
);

UserActivitySchema.index({ user: 1, date: 1 }, { unique: true });
UserActivitySchema.index({ date: 1 });
UserActivitySchema.index({ createdAt: -1 });

export const UserActivity = mongoose.model<IUserActivityDocument>('UserActivity', UserActivitySchema);
