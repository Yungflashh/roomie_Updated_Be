import { Request } from 'express';
interface AuditOptions {
    actor?: {
        id: string;
        name: string;
        email?: string;
    };
    actorType: 'user' | 'admin' | 'system';
    action: string;
    category: string;
    target?: {
        type: string;
        id: string;
        name?: string;
    };
    details?: string;
    metadata?: Record<string, any>;
    status?: 'success' | 'failure';
    req?: Request;
}
export declare function logAudit(options: AuditOptions): Promise<void>;
export {};
//# sourceMappingURL=audit.d.ts.map