// FILE: src/models/Enrollment.ts
// Enrollment — links Student to Course & Batch
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface IEnrollment extends Document {
    tenantId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    courseId: mongoose.Types.ObjectId
    batchId: mongoose.Types.ObjectId

    enrollmentNo: string
    enrollmentDate: Date
    startDate: Date
    expectedEndDate: Date

    // Progress
    status: 'active' | 'completed' | 'dropout' | 'transferred'
    completionDate?: Date
    completionPercentage: number
    attendancePercentage: number

    // Fees
    totalFee: number
    paidAmount: number
    dueAmount: number
    feesPaid: boolean

    // Certificate
    certificateIssued: boolean
    certificateIssuedAt?: Date
    certificateNo?: string

    // Metadata
    dropoutReason?: string
    remarks?: string

    franchiseId?: mongoose.Types.ObjectId

    createdAt: Date
    updatedAt: Date
}

const EnrollmentSchema = new Schema<IEnrollment>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        index: true,
    },

    enrollmentNo: { type: String, required: true },
    enrollmentDate: { type: Date, required: true },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date, required: true },

    status: {
        type: String,
        enum: ['active', 'completed', 'dropout', 'transferred'],
        default: 'active',
    },
    completionDate: { type: Date },
    completionPercentage: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },

    totalFee: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    feesPaid: { type: Boolean, default: false },

    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date },
    certificateNo: { type: String },

    dropoutReason: { type: String },
    remarks: { type: String },

    franchiseId: {
        type: Schema.Types.ObjectId,
        ref: 'Franchise',
    },
}, { timestamps: true })

// Indexes
EnrollmentSchema.index({ tenantId: 1, enrollmentNo: 1 }, { unique: true })
EnrollmentSchema.index({ tenantId: 1, studentId: 1, status: 1 })
EnrollmentSchema.index({ tenantId: 1, batchId: 1, status: 1 })
EnrollmentSchema.index({ tenantId: 1, franchiseId: 1 })

// Pre-save: calculate dueAmount
EnrollmentSchema.pre('save', function () {
    if (this.isModified('paidAmount') || this.isModified('totalFee')) {
        this.dueAmount = this.totalFee - this.paidAmount
        this.feesPaid = this.dueAmount <= 0
    }
})

export const Enrollment =
    mongoose.models.Enrollment ||
    mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema)