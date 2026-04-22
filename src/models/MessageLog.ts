// FILE: src/models/MessageLog.ts
// UPDATED: creditsUsed as Number (supports decimal)
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
    | 'registration'
    | 'system'

export interface IMessageLog extends Document {
    tenantId?: mongoose.Types.ObjectId  // ← was: tenantId (required)
    channel: MessageChannel
    purpose: MessagePurpose
    recipient: string
    recipientName?: string
    message: string
    templateId?: string
    creditsUsed: number  // ✅ Number (supports 0.1, 0.5, 1, etc.)
    status: MessageStatus
    providerMessageId?: string
    errorMessage?: string
    sentBy?: mongoose.Types.ObjectId
    sentByName?: string
    metadata?: Record<string, any>
    deliveredAt?: Date
    createdAt: Date
}

const MessageLogSchema = new Schema<IMessageLog>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: false,
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
                'attendance_absent',
                'fee_reminder',
                'fee_receipt',
                'exam_result',
                'notice',
                'admission',
                'otp',
                'custom',
                'trial_reminder',
                'subscription_confirm',
                'credit_low',
                'registration',   // ← NEW
                'system',         // ← NEW
            ],
            required: true,
        },
        recipient: { type: String, required: true },
        recipientName: { type: String },
        message: { type: String, required: true },
        templateId: { type: String },
        creditsUsed: { type: Number, default: 0 },  // ✅ Supports decimal
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
    },
    { timestamps: true }
)

MessageLogSchema.index({ tenantId: 1, createdAt: -1 })
MessageLogSchema.index({ tenantId: 1, channel: 1 })
MessageLogSchema.index({ tenantId: 1, purpose: 1 })
MessageLogSchema.index({ status: 1, createdAt: -1 })

export const MessageLog =
    mongoose.models.MessageLog || mongoose.model<IMessageLog>('MessageLog', MessageLogSchema)