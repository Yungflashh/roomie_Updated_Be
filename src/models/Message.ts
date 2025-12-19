// src/models/Message.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  match: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'game_invite' | 'game_result' | 'system';
  content?: string;
  mediaUrl?: string;
  thumbnail?: string;
  duration?: number; // For audio/video
  fileSize?: number;
  fileName?: string;
  read: boolean;
  readAt?: Date;
  deleted: boolean;
  deletedAt?: Date;
  deletedFor?: mongoose.Types.ObjectId[];
  reactions: Array<{
    user: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  replyTo?: mongoose.Types.ObjectId;
  // Game invitation data
  gameData?: {
    sessionId: mongoose.Types.ObjectId;
    gameId: mongoose.Types.ObjectId;
    gameName: string;
    gameThumbnail?: string;
    status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'expired';
    winnerId?: mongoose.Types.ObjectId;
    winnerName?: string;
  };
  // System message data (for roommate connections, etc.)
  systemData?: {
    action: string;
    relatedId?: string;
    metadata?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    match: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'game_invite', 'game_result', 'system'],
      default: 'text',
    },
    content: {
      type: String,
      maxlength: 5000,
    },
    mediaUrl: String,
    thumbnail: String,
    duration: Number,
    fileSize: Number,
    fileName: String,
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedFor: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    reactions: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      emoji: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    gameData: {
      sessionId: {
        type: Schema.Types.ObjectId,
        ref: 'GameSession',
      },
      gameId: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
      },
      gameName: String,
      gameThumbnail: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'expired'],
      },
      winnerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      winnerName: String,
    },
    systemData: {
      action: String,
      relatedId: String,
      metadata: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ 'gameData.sessionId': 1 });

// Virtual for id
messageSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

messageSchema.set('toJSON', {
  virtuals: true,
});

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);