// FILE: src/models/Enquiry.ts
// Contact/Enquiry form submissions
// Email notification + superadmin manage
// ═══════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type EnquiryStatus = 'new' | 'in_progress' | 'resolved' | 'closed'
export type EnquirySource = 'contact_form' | 'chatbot_forward' | 'direct'

export interface IEnquiry extends Document {
  // Contact info
  name: string
  email?: string
  phone: string
  schoolName?: string
  schoolLocation?: string

  // Enquiry details
  subject: string
  message: string
  interestedPlan?: string   // Which plan they're interested in
  schoolSize?: string       // Approximate student count
  source: EnquirySource

  // Status management
  status: EnquiryStatus
  superadminNote?: string
  resolvedAt?: Date

  // Email tracking
  emailSent: boolean
  emailSentAt?: Date

  // Meta
  ipAddress?: string
  createdAt: Date
  updatedAt: Date
}

const EnquirySchema = new Schema<IEnquiry>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  schoolName: { type: String, trim: true, maxlength: 200 },
  schoolLocation: { type: String, trim: true, maxlength: 100 },

  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  interestedPlan: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'enterprise', 'not_sure', ''],
    default: 'not_sure',
  },
  schoolSize: { type: String, trim: true },
  source: {
    type: String,
    enum: ['contact_form', 'chatbot_forward', 'direct'],
    default: 'contact_form',
  },

  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new',
  },
  superadminNote: { type: String },
  resolvedAt: { type: Date },

  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },

  ipAddress: { type: String },
}, { timestamps: true })

EnquirySchema.index({ status: 1, createdAt: -1 })
EnquirySchema.index({ phone: 1 })

export const Enquiry =
  mongoose.models.Enquiry ||
  mongoose.model<IEnquiry>('Enquiry', EnquirySchema)