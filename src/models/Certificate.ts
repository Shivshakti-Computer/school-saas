// FILE: src/models/Certificate.ts
// PRODUCTION READY — Certificate templates + issued certificates
// Institution-aware, verification support, optional storage
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

// ── Certificate Types ──────────────────────────────────────
export type CertificateType =
  // Common to all
  | 'merit'
  | 'participation'
  | 'achievement'
  | 'appreciation'
  | 'custom'
  // School-specific
  | 'character'
  | 'sports'
  // Academy/Coaching-specific
  | 'completion'
  | 'internship'
  | 'skill'
  | 'test_topper'

export type RecipientType = 'student' | 'staff'
export type CertificateLayout = 'classic' | 'modern' | 'elegant'
export type CertificateStatus = 'issued' | 'revoked'

// ── Template Interface ─────────────────────────────────────
export interface ICertificateTemplate extends Document {
  tenantId: mongoose.Types.ObjectId
  name: string
  type: CertificateType
  category?: string
  
  // Template content
  template: string
  layout: CertificateLayout
  
  // Institution context
  institutionType: 'school' | 'academy' | 'coaching'
  applicableTo: RecipientType | 'both'
  
  // Dynamic fields (max 10)
  fields: Array<{
    name: string
    type: 'text' | 'date' | 'number'
    required: boolean
    placeholder?: string
  }>
  
  // Customization
  showAccreditations: boolean
  signatureLabel: string
  borderStyle?: string
  
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ── Issued Certificate Interface ───────────────────────────
export interface IIssuedCertificate extends Document {
  tenantId: mongoose.Types.ObjectId
  templateId: mongoose.Types.ObjectId
  
  // Recipient
  recipientType: RecipientType
  recipientId: mongoose.Types.ObjectId
  recipientName: string
  recipientIdentifier: string
  
  // Certificate details
  certificateType: CertificateType
  certificateNumber: string
  title: string
  
  // Context (academy/coaching)
  courseId?: mongoose.Types.ObjectId
  courseName?: string
  batchId?: mongoose.Types.ObjectId
  
  // Context (school)
  class?: string
  section?: string
  academicYear?: string
  
  // Custom data
  customData: Record<string, string>
  
  // Issuance
  issuedBy: mongoose.Types.ObjectId
  issuedByName: string
  issuedDate: Date
  
  // Storage (optional)
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

// ── Template Schema ────────────────────────────────────────
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

// ── Issued Certificate Schema ──────────────────────────────
const IssuedCertificateSchema = new Schema<IIssuedCertificate>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
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
  
  // Context fields
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

IssuedCertificateSchema.index({ tenantId: 1, recipientType: 1, recipientId: 1 })
IssuedCertificateSchema.index({ tenantId: 1, certificateType: 1 })
IssuedCertificateSchema.index({ tenantId: 1, status: 1 })
IssuedCertificateSchema.index({ verificationCode: 1 })
IssuedCertificateSchema.index({ certificateNumber: 1 })

// ── Models ─────────────────────────────────────────────────
export const CertificateTemplate =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplate>('CertificateTemplate', CertificateTemplateSchema)

export const IssuedCertificate =
  mongoose.models.IssuedCertificate ||
  mongoose.model<IIssuedCertificate>('IssuedCertificate', IssuedCertificateSchema)