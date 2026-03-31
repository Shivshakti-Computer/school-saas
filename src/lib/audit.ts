// FILE: src/lib/audit.ts
// Easy-to-use audit logging functions

import { connectDB } from './db'
import { AuditLog, AuditAction, AuditResource } from '@/models/AuditLog'

interface LogParams {
  tenantId?: string
  userId?: string
  userName: string
  userRole: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  description: string
  metadata?: Record<string, any>
  previousData?: Record<string, any>
  newData?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status?: 'SUCCESS' | 'FAILURE'
}

// Risk level mapping
function getRiskLevel(action: AuditAction): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const critical: AuditAction[] = [
    'DELETE', 'BULK_DELETE', 'SCHOOL_SUSPEND',
    'PERMISSION_CHANGE', 'ROLE_CHANGE',
  ]
  const high: AuditAction[] = [
    'LOGIN_FAILED', 'LOGIN_BLOCKED', '2FA_FAILED',
    'PASSWORD_CHANGE', 'PASSWORD_RESET',
    'SUBSCRIPTION_CANCEL', 'PAYMENT_FAILED',
    '2FA_DISABLE', 'SETTINGS_CHANGE',
  ]
  const medium: AuditAction[] = [
    'CREATE', 'UPDATE', 'IMPORT', 'EXPORT',
    'SUBSCRIPTION_CREATE', 'SUBSCRIPTION_UPGRADE',
    '2FA_ENABLE', 'BULK_IMPORT',
  ]

  if (critical.includes(action)) return 'CRITICAL'
  if (high.includes(action)) return 'HIGH'
  if (medium.includes(action)) return 'MEDIUM'
  return 'LOW'
}

export async function logAudit(params: LogParams): Promise<void> {
  try {
    await connectDB()

    await AuditLog.create({
      tenantId: params.tenantId || undefined,
      userId: params.userId || undefined,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      description: params.description,
      metadata: params.metadata,
      previousData: params.previousData,
      newData: params.newData,
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      status: params.status || 'SUCCESS',
      riskLevel: getRiskLevel(params.action),
    })
  } catch (error) {
    // Audit log failure should NEVER break the app
    console.error('AUDIT LOG ERROR:', error)
  }
}

// ── Quick loggers for common actions ──

export async function logLogin(
  userId: string, userName: string, userRole: string,
  tenantId: string, ip: string, userAgent: string, success: boolean
) {
  await logAudit({
    tenantId,
    userId,
    userName,
    userRole,
    action: success ? 'LOGIN' : 'LOGIN_FAILED',
    resource: 'Auth',
    description: success
      ? `${userName} logged in successfully`
      : `Failed login attempt for ${userName}`,
    ipAddress: ip,
    userAgent,
    status: success ? 'SUCCESS' : 'FAILURE',
  })
}

export async function logDataChange(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resource: AuditResource,
  resourceId: string,
  description: string,
  session: any,
  ip: string = 'unknown',
  previousData?: any,
  newData?: any
) {
  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    userName: session.user.name || 'Unknown',
    userRole: session.user.role,
    action,
    resource,
    resourceId,
    description,
    previousData,
    newData,
    ipAddress: ip,
    status: 'SUCCESS',
  })
}