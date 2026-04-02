// FILE: src/models/MessageLog.ts
// Every SMS/Email/WhatsApp logged here
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type MessageChannel = 'sms' | 'email' | 'whatsapp'
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped'
export type MessagePurpose =
    | 'attendance_absent'
    | 'fee_reminder'
    | 'fee_receipt'
    | 'exam_result'
    | 'notice'
    | 'admission'
    | 'otp'
    | 'custom'
    | 'trial_reminder'
    | 'subscription_confirm'
    | 'credit_low'

export interface IMessageLog extends Document {
    tenantId: mongoose.Types.ObjectId
    channel: MessageChannel
    purpose: MessagePurpose
    recipient: string          // phone or email
    recipientName?: string
    message: string
    templateId?: string        // MSG91 template id
    creditsUsed: number
    status: MessageStatus
    providerMessageId?: string // MSG91 message id
    errorMessage?: string
    sentBy?: mongoose.Types.ObjectId  // User who triggered
    sentByName?: string
    metadata?: Record<string, any>
    deliveredAt?: Date
    createdAt: Date
}

const MessageLogSchema = new Schema<IMessageLog>({
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
    purpose: {
        type: String,
        enum: [
            'attendance_absent', 'fee_reminder', 'fee_receipt',
            'exam_result', 'notice', 'admission', 'otp',
            'custom', 'trial_reminder', 'subscription_confirm', 'credit_low',
        ],
        required: true,
    },
    recipient: { type: String, required: true },
    recipientName: { type: String },
    message: { type: String, required: true },
    templateId: { type: String },
    creditsUsed: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['queued', 'sent', 'delivered', 'failed', 'skipped'],
        default: 'queued',
    },
    providerMessageId: { type: String },
    errorMessage: { type: String },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sentByName: { type: String },
    metadata: { type: Schema.Types.Mixed },
    deliveredAt: { type: Date },
}, { timestamps: true })

MessageLogSchema.index({ tenantId: 1, createdAt: -1 })
MessageLogSchema.index({ tenantId: 1, channel: 1 })
MessageLogSchema.index({ tenantId: 1, purpose: 1 })
MessageLogSchema.index({ status: 1, createdAt: -1 })

export const MessageLog =
    mongoose.models.MessageLog ||
    mongoose.model<IMessageLog>('MessageLog', MessageLogSchema)