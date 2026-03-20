import mongoose, { Document } from 'mongoose';
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
export declare const AuditLog: mongoose.Model<IAuditLogDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLogDocument, {}, mongoose.DefaultSchemaOptions> & IAuditLogDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IAuditLogDocument>;
//# sourceMappingURL=AuditLog.d.ts.map