import mongoose, { Schema, Document } from 'mongoose'

export interface ICommunication extends Document {
    tenantId: mongoose.Types.ObjectId
    type: 'sms' | 'whatsapp' | 'email'
    title: string
    content: string
    recipients: 'all' | 'class' | 'section' | 'selected'
    targetClass?: string
    targetSection?: string
    studentIds?: mongoose.Types.ObjectId[]
    totalSent: number
    totalFailed: number
    sentBy: mongoose.Types.ObjectId
    sentAt: Date
}

const CommunicationSchema = new Schema<ICommunication>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    type: { type: String, enum: ['sms', 'whatsapp', 'email'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    recipients: { type: String, enum: ['all', 'class', 'section', 'selected'], required: true },
    targetClass: { type: String },
    targetSection: { type: String },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: { type: Date, default: Date.now },
}, { timestamps: true })

CommunicationSchema.index({ tenantId: 1, sentAt: -1 })

export const Communication = mongoose.models.Communication ||
    mongoose.model<ICommunication>('Communication', CommunicationSchema)