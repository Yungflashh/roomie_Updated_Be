import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaHashDocument extends Document {
  user: mongoose.Types.ObjectId;
  originalFilename: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  hashes: {
    phash?: string;
    blockhash?: string;
    md5: string;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  size: number;
  uploadedAt: Date;
}

const mediaHashSchema = new Schema<IMediaHashDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    hashes: {
      phash: String,
      blockhash: String,
      md5: {
        type: String,
        required: true,
        index: true,
      },
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast duplicate detection
mediaHashSchema.index({ 'hashes.md5': 1 });
mediaHashSchema.index({ 'hashes.phash': 1 });
mediaHashSchema.index({ 'hashes.blockhash': 1 });
mediaHashSchema.index({ user: 1, uploadedAt: -1 });

export const MediaHash = mongoose.model<IMediaHashDocument>('MediaHash', mediaHashSchema);
