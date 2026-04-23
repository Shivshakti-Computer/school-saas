// FILE: src/models/Batch.ts
// Batch model — replaces Class+Section for Academy/Coaching
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface IBatch extends Document {
    tenantId: mongoose.Types.ObjectId
    courseId: mongoose.Types.ObjectId

    batchCode: string
    batchName: string

    // Dates
    startDate: Date
    endDate: Date

    // Schedule
    schedule: {
        monday?: { startTime: string; endTime: string }
        tuesday?: { startTime: string; endTime: string }
        wednesday?: { startTime: string; endTime: string }
        thursday?: { startTime: string; endTime: string }
        friday?: { startTime: string; endTime: string }
        saturday?: { startTime: string; endTime: string }
        sunday?: { startTime: string; endTime: string }
    }

    // Capacity
    maxStudents: number
    currentEnrollments: number

    // Instructor
    instructorId: mongoose.Types.ObjectId

    // Status
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

    createdAt: Date
    updatedAt: Date
}

const BatchSchema = new Schema<IBatch>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true,
    },

    batchCode: { type: String, required: true },
    batchName: { type: String, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    schedule: {
        monday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        tuesday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        wednesday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        thursday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        friday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        saturday: {
            startTime: { type: String },
            endTime: { type: String },
        },
        sunday: {
            startTime: { type: String },
            endTime: { type: String },
        },
    },

    maxStudents: { type: Number, required: true },
    currentEnrollments: { type: Number, default: 0 },

    instructorId: {
        type: Schema.Types.ObjectId,
        ref: 'Staff',
        required: true,
    },

    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming',
    },
}, { timestamps: true })

// Indexes
BatchSchema.index({ tenantId: 1, batchCode: 1 }, { unique: true })
BatchSchema.index({ tenantId: 1, courseId: 1 })
BatchSchema.index({ tenantId: 1, status: 1 })
BatchSchema.index({ tenantId: 1, instructorId: 1 })

export const Batch =
    mongoose.models.Batch ||
    mongoose.model<IBatch>('Batch', BatchSchema)