import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const AppConfig = mongoose.model('AppConfig', appConfigSchema);
