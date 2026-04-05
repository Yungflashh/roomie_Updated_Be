import mongoose, { Schema, Document } from 'mongoose';

export interface IReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  reported: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  adminNote: { type: String },
}, { timestamps: true });

reportSchema.index({ status: 1 });
reportSchema.index({ reported: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReportDocument>('Report', reportSchema);
