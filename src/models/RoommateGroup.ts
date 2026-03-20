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
  name: string;
  description?: string;
  coverImage?: string;
  inviteCode: string;
  inviteLink?: string;
  createdBy: mongoose.Types.ObjectId;
  members: IGroupMember[];
  maxMembers: number;
  settings: {
    allowMemberInvites: boolean;
    requireAdminApproval: boolean;
    defaultSplitType: 'equal' | 'custom';
    currency: string;
  };
  isActive: boolean;
  features: {
    locationSharing: boolean;
    emergencyAlerts: boolean;
    personalityBoard: boolean;
  };
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
      maxlength: 10,
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
    features: {
      locationSharing: { type: Boolean, default: false },
      emergencyAlerts: { type: Boolean, default: true },
      personalityBoard: { type: Boolean, default: true },
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

// Active group lookups
roommateGroupSchema.index({ 'members.user': 1, 'members.status': 1, isActive: 1 });
roommateGroupSchema.index({ isActive: 1 });

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

/**
 * Generate unique invite code based on room name
 * Format: [PREFIX][NUMBERS] (e.g., "APT4523", "CRIB8234")
 * @param roomName - The name of the room
 * @returns A unique invite code
 */
roommateGroupSchema.statics.generateInviteCode = async function(roomName: string): Promise<string> {
  // Extract letters from room name and take first 3-4
  const letters = roomName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = letters.substring(0, Math.min(4, Math.max(3, letters.length)));
  
  // If no valid letters, use a default prefix
  const finalPrefix = prefix.length >= 3 ? prefix : 'ROOM';
  
  // Characters for numeric/alphanumeric suffix
  const numbers = '0123456789';
  const alphanumeric = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  let code: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 50;
  
  while (exists && attempts < maxAttempts) {
    // Generate 4-digit number suffix
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    code = finalPrefix + suffix;
    
    // Ensure code length is within bounds (6-10 characters)
    if (code.length < 6) {
      // Add extra random characters if too short
      const needed = 6 - code.length;
      for (let i = 0; i < needed; i++) {
        code += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
      }
    } else if (code.length > 10) {
      // Trim if too long (shouldn't happen with 4-letter prefix + 4 digits)
      code = code.substring(0, 10);
    }
    
    exists = await this.findOne({ inviteCode: code }) !== null;
    attempts++;
  }
  
  // Fallback: if all attempts failed, generate completely random code
  if (exists) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
    }
  }
  
  return code!;
};

export const RoommateGroup = mongoose.model<IRoommateGroupDocument>('RoommateGroup', roommateGroupSchema);