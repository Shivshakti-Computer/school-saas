// FILE: src/models/Notice.ts (PRODUCTION VERSION)
import mongoose, { Schema, Document } from 'mongoose'

export type NoticeStatus = 'draft' | 'published' | 'archived'
export type NoticePriority = 'low' | 'normal' | 'high' | 'urgent'
export type NoticeTargetRole = 'all' | 'student' | 'teacher' | 'parent' | 'staff'

export interface INoticeAttachment {
    name: string
    url: string
    type: 'pdf' | 'image' | 'doc' | 'other'
    size: number
    uploadedAt: Date
}

export interface INotice extends Document {
    tenantId: mongoose.Types.ObjectId

    // ── Content ──
    title: string
    content: string

    // ── Status & Workflow ──
    status: NoticeStatus
    publishedAt?: Date
    expiresAt?: Date
    isPinned: boolean

    creditsUsed: number  // Total credits spent on notifications

    // ── Targeting ──
    targetRole: NoticeTargetRole
    targetClasses: string[]  // Empty = all classes

    // ── Priority ──
    priority: NoticePriority

    // ── Attachments ──
    attachments: INoticeAttachment[]

    // ── Notifications ──
    smsSent: boolean
    emailSent: boolean
    whatsappSent: boolean
    pushSent: boolean
    notificationCount: number

    // ── Read Tracking ──
    readCount: number

    // ── Author ──
    createdBy: mongoose.Types.ObjectId
    createdByName: string
    createdByRole: string

    // ── Audit ──
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

const NoticeAttachmentSchema = new Schema<INoticeAttachment>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
        type: String,
        enum: ['pdf', 'image', 'doc', 'other'],
        default: 'other'
    },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const NoticeSchema = new Schema<INotice>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },

    // ── Content ──
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
    },

    // ── Status ──
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
        index: true,
    },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    isPinned: { type: Boolean, default: false },

    // ── Targeting ──
    targetRole: {
        type: String,
        enum: ['all', 'student', 'teacher', 'parent', 'staff'],
        default: 'all',
        index: true,
    },
    targetClasses: {
        type: [String],
        default: [],
    },

    // ── Priority ──
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
    },

    // ── Attachments ──
    attachments: {
        type: [NoticeAttachmentSchema],
        default: [],
    },

    // ── Notifications ──
    smsSent: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    whatsappSent: { type: Boolean, default: false },  // ✅ ADD after emailSent
    pushSent: { type: Boolean, default: false },
    notificationCount: { type: Number, default: 0 },

    creditsUsed: { type: Number, default: 0 },

    // ── Read Tracking ──
    readCount: { type: Number, default: 0 },

    // ── Author ──
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdByName: { type: String, required: true },
    createdByRole: { type: String, required: true },

    // ── Audit ──
    isActive: { type: Boolean, default: true },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// ── Indexes for Performance ──
NoticeSchema.index({ tenantId: 1, status: 1, publishedAt: -1 })
NoticeSchema.index({ tenantId: 1, targetRole: 1, status: 1 })
NoticeSchema.index({ tenantId: 1, isPinned: -1, publishedAt: -1 })
NoticeSchema.index({ tenantId: 1, expiresAt: 1, status: 1 })
NoticeSchema.index({ tenantId: 1, createdBy: 1 })

// ── Pre-save Hook ──
NoticeSchema.pre('save', function() {
    // Auto-set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date()
    }
})

// ── Virtual: isExpired ──
NoticeSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt) return false
    return new Date(this.expiresAt) < new Date()
})

export const Notice =
    mongoose.models.Notice ||
    mongoose.model<INotice>('Notice', NoticeSchema)