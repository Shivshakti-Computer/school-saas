// FILE: src/models/Certificate.ts
// SAFE UPDATE: Add franchiseId support
// Existing certificates will continue working
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

// ────────────────────────────────────────────────────────────
// EXISTING TYPES (UNCHANGED)
// ────────────────────────────────────────────────────────────

export type CertificateType =
  | 'merit'
  | 'participation'
  | 'achievement'
  | 'appreciation'
  | 'custom'
  | 'character'
  | 'sports'
  | 'completion'
  | 'internship'
  | 'skill'
  | 'test_topper'

export type RecipientType = 'student' | 'staff'
export type CertificateLayout = 'classic' | 'modern' | 'elegant'
export type CertificateStatus = 'issued' | 'revoked'

// ────────────────────────────────────────────────────────────
// EXISTING INTERFACES (UNCHANGED)
// ────────────────────────────────────────────────────────────

export interface ICertificateTemplate extends Document {
  tenantId: mongoose.Types.ObjectId
  name: string
  type: CertificateType
  category?: string
  template: string
  layout: CertificateLayout
  institutionType: 'school' | 'academy' | 'coaching'
  applicableTo: RecipientType | 'both'
  fields: Array<{
    name: string
    type: 'text' | 'date' | 'number'
    required: boolean
    placeholder?: string
  }>
  showAccreditations: boolean
  signatureLabel: string
  borderStyle?: string
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ────────────────────────────────────────────────────────────
// UPDATE: IIssuedCertificate Interface (Add franchiseId)
// ────────────────────────────────────────────────────────────

export interface IIssuedCertificate extends Document {
  tenantId: mongoose.Types.ObjectId

  // ✅ NEW: Franchise Reference (OPTIONAL — backward compatible)
  franchiseId?: mongoose.Types.ObjectId

  templateId: mongoose.Types.ObjectId
  recipientType: RecipientType
  recipientId: mongoose.Types.ObjectId
  recipientName: string
  recipientIdentifier: string
  certificateType: CertificateType
  certificateNumber: string
  title: string

  // Context
  courseId?: mongoose.Types.ObjectId
  courseName?: string
  batchId?: mongoose.Types.ObjectId
  class?: string
  section?: string
  academicYear?: string

  customData: Record<string, string>

  // Issuance
  issuedBy: mongoose.Types.ObjectId
  issuedByName: string
  issuedDate: Date

  // Storage
  pdfUrl?: string
  savedToStorage: boolean

  // Verification
  verificationCode: string
  isVerified: boolean
  verifiedAt?: Date

  // Status
  status: CertificateStatus
  revokedAt?: Date
  revokedReason?: string

  createdAt: Date
  updatedAt: Date
}

// ────────────────────────────────────────────────────────────
// EXISTING SCHEMAS (UNCHANGED)
// ────────────────────────────────────────────────────────────

const FieldSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'date', 'number'],
    required: true,
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
}, { _id: false })

const CertificateTemplateSchema = new Schema<ICertificateTemplate>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'merit', 'participation', 'achievement', 'appreciation', 'custom',
      'character', 'sports',
      'completion', 'internship', 'skill', 'test_topper',
    ],
    required: true,
  },
  category: { type: String },
  template: { type: String, required: true },
  layout: {
    type: String,
    enum: ['classic', 'modern', 'elegant'],
    default: 'modern',
  },
  institutionType: {
    type: String,
    enum: ['school', 'academy', 'coaching'],
    required: true,
  },
  applicableTo: {
    type: String,
    enum: ['student', 'staff', 'both'],
    default: 'student',
  },
  fields: {
    type: [FieldSchema],
    validate: {
      validator: (fields: any[]) => fields.length <= 10,
      message: 'Maximum 10 fields allowed',
    },
  },
  showAccreditations: { type: Boolean, default: true },
  signatureLabel: { type: String, default: 'Principal' },
  borderStyle: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true })

CertificateTemplateSchema.index({ tenantId: 1, type: 1 })
CertificateTemplateSchema.index({ tenantId: 1, isActive: 1 })

// ────────────────────────────────────────────────────────────
// UPDATE: IssuedCertificateSchema (Add franchiseId)
// ────────────────────────────────────────────────────────────

const IssuedCertificateSchema = new Schema<IIssuedCertificate>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },

  // ✅ NEW: Franchise Reference (OPTIONAL)
  franchiseId: {
    type: Schema.Types.ObjectId,
    ref: 'Franchise',
    index: true,
  },

  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
    required: true,
  },
  recipientType: {
    type: String,
    enum: ['student', 'staff'],
    required: true,
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  recipientName: { type: String, required: true },
  recipientIdentifier: { type: String, required: true },
  certificateType: {
    type: String,
    enum: [
      'merit', 'participation', 'achievement', 'appreciation', 'custom',
      'character', 'sports',
      'completion', 'internship', 'skill', 'test_topper',
    ],
    required: true,
  },
  certificateNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },

  // Context
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  courseName: { type: String },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
  class: { type: String },
  section: { type: String },
  academicYear: { type: String },

  customData: { type: Schema.Types.Mixed, default: {} },

  issuedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issuedByName: { type: String, required: true },
  issuedDate: { type: Date, default: Date.now },

  pdfUrl: { type: String },
  savedToStorage: { type: Boolean, default: false },

  verificationCode: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  status: {
    type: String,
    enum: ['issued', 'revoked'],
    default: 'issued',
  },
  revokedAt: { type: Date },
  revokedReason: { type: String },
}, { timestamps: true })

// Indexes
IssuedCertificateSchema.index({ tenantId: 1, recipientType: 1, recipientId: 1 })
IssuedCertificateSchema.index({ tenantId: 1, certificateType: 1 })
IssuedCertificateSchema.index({ tenantId: 1, status: 1 })
IssuedCertificateSchema.index({ tenantId: 1, franchiseId: 1 })  // ✅ NEW INDEX

// ────────────────────────────────────────────────────────────
// MODELS (UNCHANGED)
// ────────────────────────────────────────────────────────────

export const CertificateTemplate =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplate>('CertificateTemplate', CertificateTemplateSchema)

export const IssuedCertificate =
  mongoose.models.IssuedCertificate ||
  mongoose.model<IIssuedCertificate>('IssuedCertificate', IssuedCertificateSchema)