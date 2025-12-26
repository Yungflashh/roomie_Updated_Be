// src/models/Admin.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'moderator';
  isActive: boolean;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);