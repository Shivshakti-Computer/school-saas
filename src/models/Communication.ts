// FILE: src/models/Communication.ts
// UPDATED: academicYear field added (backward compatible)
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface ICommunication extends Document {
  tenantId: mongoose.Types.ObjectId
  channel: 'sms' | 'email' | 'whatsapp'
  purpose: string
  title?: string
  message: string
  recipients: 'all' | 'class' | 'section'
  recipientType?: 'parent' | 'student'
  academicYear?: string               // ← Bug 4 fix
  targetClass?: string
  targetSection?: string
  totalSent: number
  totalFailed: number
  totalSkipped: number
  creditsUsed: number
  sentBy: mongoose.Types.ObjectId
  sentByName?: string
  sentAt: Date
  createdAt: Date
  updatedAt: Date
}

const CommunicationSchema = new Schema<ICommunication>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'email', 'whatsapp'],
      required: true,
    },
    purpose: { type: String, required: true },
    title: { type: String },
    message: { type: String, required: true },
    recipients: {
      type: String,
      enum: ['all', 'class', 'section'],
      required: true,
    },
    recipientType: {
      type: String,
      enum: ['parent', 'student'],
      default: 'parent',
    },
    // ← Bug 4 fix — optional for backward compat
    academicYear: {
      type: String,
      default: null,
    },
    targetClass: { type: String },
    targetSection: { type: String },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 },
    creditsUsed: { type: Number, default: 0 },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentByName: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

CommunicationSchema.index({ tenantId: 1, sentAt: -1 })
CommunicationSchema.index({ tenantId: 1, channel: 1 })
CommunicationSchema.index({ tenantId: 1, academicYear: 1 })

export const Communication =
  mongoose.models.Communication ||
  mongoose.model<ICommunication>(
    'Communication',
    CommunicationSchema
  )