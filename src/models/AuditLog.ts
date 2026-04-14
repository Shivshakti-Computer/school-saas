// FILE: src/models/AuditLog.ts
// Tracks every important action in the system

import mongoose, { Schema, Document } from 'mongoose'

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'LOGIN_BLOCKED'
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'IMPORT'
  | 'PASSWORD_CHANGE' | 'PASSWORD_RESET'
  | '2FA_ENABLE' | '2FA_DISABLE' | '2FA_VERIFY' | '2FA_FAILED'
  | 'SUBSCRIPTION_CREATE' | 'SUBSCRIPTION_UPGRADE' | 'SUBSCRIPTION_CANCEL' | 'SUBSCRIPTION_EXPIRE'
  | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'
  | 'PERMISSION_CHANGE' | 'ROLE_CHANGE'
  | 'SCHOOL_REGISTER' | 'SCHOOL_SUSPEND' | 'SCHOOL_ACTIVATE'
  | 'BULK_IMPORT' | 'BULK_DELETE'
  | 'SETTINGS_CHANGE' | 'MODULE_ACCESS_DENIED'

export type AuditResource =
  // ── Core ──
  | 'Auth' | 'User' | 'Staff' | 'Student' | 'Teacher' | 'Parent'
  | 'School' | 'Subscription' | 'Payment'
  // ── Academic ──
  | 'Attendance' | 'Fee' | 'Exam' | 'Timetable'
  | 'Notice' | 'Homework' | 'Document' | 'Certificate'
  | 'Report' | 'Result'
  // ── Modules (remaining) ──
  | 'Library'
  | 'Transport'
  | 'Hostel'
  | 'Inventory'
  | 'Health'
  | 'Alumni'
  | 'Visitor'
  | 'Gallery'
  | 'HR'
  | 'LMS'
  | 'Communication'
  | 'Website'
  // ── System ──
  | 'Settings' | 'System'

export interface IAuditLog extends Document {
  tenantId?:    mongoose.Types.ObjectId
  userId?:      mongoose.Types.ObjectId
  userName:     string
  userRole:     string
  action:       AuditAction
  resource:     AuditResource
  resourceId?:  string
  description:  string
  metadata?:    Record<string, any>
  previousData?: Record<string, any>
  newData?:     Record<string, any>
  ipAddress:    string
  userAgent:    string
  status:       'SUCCESS' | 'FAILURE'
  riskLevel:    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt:    Date
}

// ── Resource enum values — single source of truth ──
const AUDIT_RESOURCES = [
  // Core
  'Auth', 'User', 'Staff', 'Student', 'Teacher', 'Parent',
  'School', 'Subscription', 'Payment',
  // Academic
  'Attendance', 'Fee', 'Exam', 'Timetable',
  'Notice', 'Homework', 'Document', 'Certificate',
  'Report', 'Result',
  // Modules
  'Library',
  'Transport',
  'Hostel',
  'Inventory',
  'Health',
  'Alumni',
  'Visitor',
  'Gallery',
  'HR',
  'LMS',
  'Communication',
  'Website',
  // System
  'Settings', 'System',
] as const

const AuditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    userId:   { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'LOGIN_BLOCKED',
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT',
        'PASSWORD_CHANGE', 'PASSWORD_RESET',
        '2FA_ENABLE', '2FA_DISABLE', '2FA_VERIFY', '2FA_FAILED',
        'SUBSCRIPTION_CREATE', 'SUBSCRIPTION_UPGRADE',
        'SUBSCRIPTION_CANCEL', 'SUBSCRIPTION_EXPIRE',
        'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
        'PERMISSION_CHANGE', 'ROLE_CHANGE',
        'SCHOOL_REGISTER', 'SCHOOL_SUSPEND', 'SCHOOL_ACTIVATE',
        'BULK_IMPORT', 'BULK_DELETE',
        'SETTINGS_CHANGE', 'MODULE_ACCESS_DENIED',
      ],
      index: true,
    },
    resource: {
      type:     String,
      required: true,
      enum:     AUDIT_RESOURCES,
    },
    resourceId:   { type: String },
    description:  { type: String, required: true },
    metadata:     { type: Schema.Types.Mixed },
    previousData: { type: Schema.Types.Mixed },
    newData:      { type: Schema.Types.Mixed },
    ipAddress:    { type: String, default: 'unknown' },
    userAgent:    { type: String, default: 'unknown' },
    status: {
      type:    String,
      enum:    ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
    },
    riskLevel: {
      type:    String,
      enum:    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
  },
  {
    timestamps: true,
    // Auto-delete logs older than 90 days
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
)

// ── Indexes ──
AuditLogSchema.index({ createdAt: -1 })
AuditLogSchema.index({ tenantId: 1, createdAt: -1 })
AuditLogSchema.index({ tenantId: 1, action: 1 })
AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ riskLevel: 1 })

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)