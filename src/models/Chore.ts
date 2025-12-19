// src/models/Chore.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IChoreAssignment {
  user: mongoose.Types.ObjectId;
  assignedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'done' | 'verified' | 'skipped' | 'disputed' | 'transferred';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  transferredTo?: mongoose.Types.ObjectId;
  transferredBy?: mongoose.Types.ObjectId;
  transferCost?: number;
  notes?: string;
  proofImage?: string;
}

export interface IChore {
  group: mongoose.Types.ObjectId; // RoommateGroup reference
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  icon: string;
  category: 'cleaning' | 'kitchen' | 'bathroom' | 'laundry' | 'trash' | 'shopping' | 'pets' | 'maintenance' | 'other';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'once';
  rotationType: 'rotate' | 'fixed' | 'volunteer' | 'random';
  assignTo: 'all' | 'selected'; // All group members or selected ones
  currentAssignee?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[]; // Users who rotate this chore
  rotationOrder: mongoose.Types.ObjectId[]; // Order for rotation
  currentRotationIndex: number;
  assignments: IChoreAssignment[];
  nextDueDate?: Date;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChoreDocument extends IChore, Document {}

const choreAssignmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'done', 'verified', 'skipped', 'disputed', 'transferred'],
    default: 'pending',
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  transferredTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  transferredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  transferCost: Number,
  notes: String,
  proofImage: String,
}, { _id: true });

const choreSchema = new Schema<IChoreDocument>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: '🧹',
    },
    category: {
      type: String,
      enum: ['cleaning', 'kitchen', 'bathroom', 'laundry', 'trash', 'shopping', 'pets', 'maintenance', 'other'],
      default: 'other',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'once'],
      default: 'weekly',
    },
    rotationType: {
      type: String,
      enum: ['rotate', 'fixed', 'volunteer', 'random'],
      default: 'rotate',
    },
    assignTo: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    currentAssignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    rotationOrder: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    currentRotationIndex: {
      type: Number,
      default: 0,
    },
    assignments: [choreAssignmentSchema],
    nextDueDate: Date,
    points: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
choreSchema.index({ group: 1, isActive: 1 });
choreSchema.index({ currentAssignee: 1, nextDueDate: 1 });
choreSchema.index({ group: 1, category: 1 });
choreSchema.index({ 'participants': 1 });

choreSchema.set('toJSON', { virtuals: true });
choreSchema.set('toObject', { virtuals: true });

export const Chore = mongoose.model<IChoreDocument>('Chore', choreSchema);