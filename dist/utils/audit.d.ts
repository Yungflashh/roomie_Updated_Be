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
/**
 * Persists an audit log entry. Failures are swallowed so that audit errors
 * never interrupt the calling request.
 */
export declare function logAudit(options: AuditOptions): Promise<void>;
export {};
//# sourceMappingURL=audit.d.ts.map