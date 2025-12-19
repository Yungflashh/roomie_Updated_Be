// src/models/RoommateGroup.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  invitedBy?: mongoose.Types.ObjectId;
  status: 'active' | 'left' | 'removed';
  leftAt?: Date;
}

export interface IRoommateGroup {
  name: string; // e.g., "Apartment 4B", "The Crib"
  description?: string;
  coverImage?: string;
  inviteCode: string; // Unique code for joining
  inviteLink?: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  maxMembers: number; // Default 10
  settings: {
    allowMemberInvites: boolean; // Can members invite others?
    requireAdminApproval: boolean; // Need admin to approve new members?
    defaultSplitType: 'equal' | 'custom';
    currency: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoommateGroupDocument extends IRoommateGroup, Document {
  activeMembers: IGroupMember[];
  memberCount: number;
}

const groupMemberSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'left', 'removed'],
    default: 'active',
  },
  leftAt: Date,
}, { _id: true });

const roommateGroupSchema = new Schema<IRoommateGroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    coverImage: String,
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 8,
    },
    inviteLink: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [groupMemberSchema],
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 20,
    },
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
      requireAdminApproval: {
        type: Boolean,
        default: false,
      },
      defaultSplitType: {
        type: String,
        enum: ['equal', 'custom'],
        default: 'equal',
      },
      currency: {
        type: String,
        default: 'NGN',
      },
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
roommateGroupSchema.index({ inviteCode: 1 }, { unique: true });
roommateGroupSchema.index({ 'members.user': 1 });
roommateGroupSchema.index({ createdBy: 1 });

// Virtual: Get active members only
roommateGroupSchema.virtual('activeMembers').get(function() {
  return this.members.filter(m => m.status === 'active');
});

// Virtual: Count active members
roommateGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.status === 'active').length;
});

roommateGroupSchema.set('toJSON', { virtuals: true });
roommateGroupSchema.set('toObject', { virtuals: true });

// Generate unique invite code
roommateGroupSchema.statics.generateInviteCode = async function(): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
  let code: string;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    exists = await this.findOne({ inviteCode: code }) !== null;
  }
  
  return code!;
};

export const RoommateGroup = mongoose.model<IRoommateGroupDocument>('RoommateGroup', roommateGroupSchema);