"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const AuditLog_1 = require("../models/AuditLog");
/**
 * Persists an audit log entry. Failures are swallowed so that audit errors
 * never interrupt the calling request.
 */
async function logAudit(options) {
    try {
        await AuditLog_1.AuditLog.create({
            actor: options.actor?.id,
            actorType: options.actorType,
            actorName: options.actor?.name || 'System',
            actorEmail: options.actor?.email || '',
            action: options.action,
            category: options.category,
            target: options.target,
            details: options.details,
            metadata: options.metadata,
            ip: options.req?.ip || options.req?.headers['x-forwarded-for'] || '',
            userAgent: options.req?.headers['user-agent'] || '',
            status: options.status || 'success',
        });
    }
    catch (err) {
        console.error('Audit log error:', err);
    }
}
//# sourceMappingURL=audit.js.map