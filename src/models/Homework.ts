// FILE: src/models/Homework.ts
// ═══════════════════════════════════════════════════════════
// Homework Management — Complete Production Model
// Features:
//   - Class/section/subject-wise homework
//   - File attachments
//   - Student submissions
//   - Teacher grading
//   - Late submission tracking
//   - Auto reminders
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type HomeworkStatus = 'active' | 'archived'
export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded'

export interface IHomeworkAttachment {
    name: string
    url: string
    type: 'pdf' | 'image' | 'doc' | 'other'
    size: number
    uploadedAt: Date
}

export interface IHomeworkSubmission {
    studentId: mongoose.Types.ObjectId
    studentName: string
    studentClass: string
    studentSection: string
    rollNumber?: string
    submittedAt?: Date
    isLate: boolean
    attachments: IHomeworkAttachment[]
    remarks?: string
    status: SubmissionStatus
    grade?: {
        marks?: number
        maxMarks?: number
        grade?: string
        feedback?: string
        gradedBy?: mongoose.Types.ObjectId
        gradedByName?: string
        gradedAt?: Date
    }
}

export interface IHomework extends Document {
    tenantId: mongoose.Types.ObjectId
    academicYear: string

    // ── Content ──
    title: string
    description: string
    subject: string

    // ── Target ──
    class: string
    section?: string
    targetStudents: mongoose.Types.ObjectId[] // Empty = all students in class

    // ── Deadline ──
    assignedDate: Date
    dueDate: Date
    allowLateSubmission: boolean

    // ── Attachments ──
    attachments: IHomeworkAttachment[]

    // ── Submissions ──
    submissions: IHomeworkSubmission[]
    totalStudents: number
    submittedCount: number
    pendingCount: number
    lateCount: number
    gradedCount: number

    // ── Settings ──
    maxFileSizeMB: number
    allowedFileTypes: string[]

    // ── Notifications ──
    notificationSent: boolean
    reminderSent: boolean

    // CrditUsed 
    creditsUsed: number

    // ── Author ──
    createdBy: mongoose.Types.ObjectId
    createdByName: string
    createdByRole: string

    // ── Status ──
    status: HomeworkStatus
    isActive: boolean

    createdAt: Date
    updatedAt: Date
}

const HomeworkAttachmentSchema = new Schema<IHomeworkAttachment>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
        type: String,
        enum: ['pdf', 'image', 'doc', 'other'],
        default: 'other',
    },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const HomeworkSubmissionSchema = new Schema<IHomeworkSubmission>({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studentName: { type: String, required: true },
    studentClass: { type: String, required: true },
    studentSection: { type: String },
    rollNumber: { type: String },
    submittedAt: { type: Date },
    isLate: { type: Boolean, default: false },
    attachments: {
        type: [HomeworkAttachmentSchema],
        default: [],
    },
    remarks: { type: String },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'late', 'graded'],
        default: 'pending',
    },
    grade: {
        marks: { type: Number },
        maxMarks: { type: Number },
        grade: { type: String },
        feedback: { type: String },
        gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        gradedByName: { type: String },
        gradedAt: { type: Date },
    },
}, { _id: false })

const HomeworkSchema = new Schema<IHomework>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    academicYear: {
        type: String,
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
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    subject: {
        type: String,
        required: true,
        index: true,
    },

    // ── Target ──
    class: {
        type: String,
        required: true,
        index: true,
    },
    section: { type: String },
    targetStudents: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },

    // ── Deadline ──
    assignedDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
        index: true,
    },
    allowLateSubmission: {
        type: Boolean,
        default: true,
    },

    // ── Attachments ──
    attachments: {
        type: [HomeworkAttachmentSchema],
        default: [],
    },

    // ── Submissions ──
    submissions: {
        type: [HomeworkSubmissionSchema],
        default: [],
    },
    totalStudents: { type: Number, default: 0 },
    submittedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    gradedCount: { type: Number, default: 0 },

    // ── Settings ──
    maxFileSizeMB: { type: Number, default: 10 },
    allowedFileTypes: {
        type: [String],
        default: ['pdf', 'jpg', 'jpeg', 'png', 'docx'],
    },

    // ── Notifications ──
    notificationSent: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },

    creditsUsed: { type: Number, default: 0 },

    // ── Author ──
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdByName: { type: String, required: true },
    createdByRole: { type: String, required: true },

    // ── Status ──
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active',
    },
    isActive: { type: Boolean, default: true },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// ── Indexes for Performance ──
HomeworkSchema.index({ tenantId: 1, academicYear: 1, status: 1 })
HomeworkSchema.index({ tenantId: 1, class: 1, dueDate: -1 })
HomeworkSchema.index({ tenantId: 1, subject: 1, dueDate: -1 })
HomeworkSchema.index({ tenantId: 1, createdBy: 1 })
HomeworkSchema.index({ dueDate: 1, status: 1 }) // For reminder cron
HomeworkSchema.index({ tenantId: 1, createdBy: 1 })

// ── Virtual: isExpired ──
HomeworkSchema.virtual('isExpired').get(function () {
    return new Date(this.dueDate) < new Date()
})

// ── Virtual: isOverdue ──
HomeworkSchema.virtual('isOverdue').get(function () {
    const now = new Date()
    return new Date(this.dueDate) < now && this.pendingCount > 0
})

// ── Virtual: completionRate ──
HomeworkSchema.virtual('completionRate').get(function () {
    if (this.totalStudents === 0) return 0
    return Math.round((this.submittedCount / this.totalStudents) * 100)
})

export const Homework =
    mongoose.models.Homework ||
    mongoose.model<IHomework>('Homework', HomeworkSchema)





    // FILE: src/models/Homework.ts (ADD creditsUsed field)
// ─── Sirf ye field add karni hai existing model mein ───

// ... existing schema code ...

// notifications ke baad add karo:


// Index mein add karo:
