import { AuditLog } from '../models/AuditLog';
import { Request } from 'express';

interface AuditOptions {
  actor?: { id: string; name: string; email?: string };
  actorType: 'user' | 'admin' | 'system';
  action: string;
  category: string;
  target?: { type: string; id: string; name?: string };
  details?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'failure';
  req?: Request;
}

/**
 * Persists an audit log entry. Failures are swallowed so that audit errors
 * never interrupt the calling request.
 */
export async function logAudit(options: AuditOptions): Promise<void> {
  try {
    await AuditLog.create({
      actor: options.actor?.id,
      actorType: options.actorType,
      actorName: options.actor?.name || 'System',
      actorEmail: options.actor?.email || '',
      action: options.action,
      category: options.category,
      target: options.target,
      details: options.details,
      metadata: options.metadata,
      ip: options.req?.ip || (options.req?.headers['x-forwarded-for'] as string) || '',
      userAgent: options.req?.headers['user-agent'] || '',
      status: options.status || 'success',
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
