import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChatDocument extends Document {
  user: mongoose.Types.ObjectId;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  }>;
  title: string;
  updatedAt: Date;
}

export interface IAIPreferencesDocument extends Document {
  user: mongoose.Types.ObjectId;
  aiName: string;
  colorTheme: string;
  personality: string;
  updatedAt: Date;
}

const aiChatSchema = new Schema<IAIChatDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: [{
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    title: { type: String, default: 'New Chat' },
  },
  { timestamps: true }
);

const aiPreferencesSchema = new Schema<IAIPreferencesDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    aiName: { type: String, default: 'Roomie AI' },
    colorTheme: { type: String, default: '#0d9488' },
    personality: {
      type: String,
      enum: ['friendly', 'professional', 'casual', 'motivational'],
      default: 'friendly',
    },
  },
  { timestamps: true }
);

export const AIChat = mongoose.model<IAIChatDocument>('AIChat', aiChatSchema);
export const AIPreferences = mongoose.model<IAIPreferencesDocument>('AIPreferences', aiPreferencesSchema);
