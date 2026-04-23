// FILE: src/models/Course.ts
// Course model for Academy & Coaching institutes
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface ICourse extends Document {
    tenantId: mongoose.Types.ObjectId
    institutionType: 'academy' | 'coaching'

    // Basic Info
    name: string
    code: string
    category: string

    // Duration
    durationType: 'days' | 'weeks' | 'months' | 'custom'
    durationValue: number
    customDurationText?: string

    // Fee
    feeAmount: number
    feeType: 'one-time' | 'monthly' | 'installment'
    installments?: {
        number: number
        amount: number
        dueDay: number  // day of month
    }

    // Content
    description: string
    syllabus: string[]
    prerequisites: string[]
    learningOutcomes: string[]

    // Settings
    maxStudents?: number
    minStudents?: number
    isActive: boolean
    certificateEligible: boolean
    certificateTemplate?: string

    // Metadata
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const CourseSchema = new Schema<ICourse>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    institutionType: {
        type: String,
        enum: ['academy', 'coaching'],
        required: true,
    },

    // Basic
    name: { type: String, required: true },
    code: { type: String, required: true },
    category: { type: String, required: true },

    // Duration
    durationType: {
        type: String,
        enum: ['days', 'weeks', 'months', 'custom'],
        default: 'months',
    },
    durationValue: { type: Number, required: true },
    customDurationText: { type: String },

    // Fee
    feeAmount: { type: Number, required: true },
    feeType: {
        type: String,
        enum: ['one-time', 'monthly', 'installment'],
        default: 'one-time',
    },
    installments: {
        number: { type: Number },
        amount: { type: Number },
        dueDay: { type: Number, min: 1, max: 28 },
    },

    // Content
    description: { type: String, default: '' },
    syllabus: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    learningOutcomes: { type: [String], default: [] },

    // Settings
    maxStudents: { type: Number },
    minStudents: { type: Number },
    isActive: { type: Boolean, default: true },
    certificateEligible: { type: Boolean, default: true },
    certificateTemplate: { type: String },

    // Metadata
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

// Indexes
CourseSchema.index({ tenantId: 1, code: 1 }, { unique: true })
CourseSchema.index({ tenantId: 1, category: 1 })
CourseSchema.index({ tenantId: 1, isActive: 1 })

export const Course =
    mongoose.models.Course ||
    mongoose.model<ICourse>('Course', CourseSchema)