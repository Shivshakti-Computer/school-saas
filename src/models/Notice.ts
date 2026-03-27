// FILE: src/models/Notice.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface INotice extends Document {
    tenantId: mongoose.Types.ObjectId
    title: string
    content: string
    attachment?: string          // Cloudinary URL (PDF/image)
    targetRole: 'all' | 'student' | 'teacher' | 'parent' | 'staff'
    targetClass?: string         // optional: sirf ek class ke liye
    priority: 'normal' | 'urgent'
    publishedAt: Date
    expiresAt?: Date
    smsSent: boolean
    pushSent: boolean
    smsCount: number          // kitne SMS gaye
    createdBy: mongoose.Types.ObjectId
    isActive: boolean
}

const NoticeSchema = new Schema<INotice>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    attachment: { type: String },
    targetRole: { type: String, enum: ['all', 'student', 'teacher', 'parent', 'staff'], default: 'all' },
    targetClass: { type: String },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    smsSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
    smsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

NoticeSchema.index({ tenantId: 1, publishedAt: -1 })
NoticeSchema.index({ tenantId: 1, targetRole: 1, isActive: 1 })

export const Notice = mongoose.models.Notice ||
    mongoose.model<INotice>('Notice', NoticeSchema)