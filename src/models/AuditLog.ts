import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLogDocument extends Document {
  actor: string;
  actorType: 'user' | 'admin' | 'system';
  actorName: string;
  actorEmail: string;
  action: string;
  category: string;
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  details?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: { type: String, index: true },
    actorType: { type: String, enum: ['user', 'admin', 'system'], required: true, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    target: {
      type: { type: String },
      id: { type: String },
      name: { type: String },
    },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'target.type': 1, 'target.id': 1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
