import mongoose, { Schema, Document } from 'mongoose'

export interface IHealthRecord extends Document {
    tenantId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    height?: number
    weight?: number
    bloodGroup?: string
    allergies?: string[]
    medicalConditions?: string[]
    medications?: string[]
    emergencyContact?: string
    checkups: Array<{
        date: Date
        type: string
        notes?: string
        doctor?: string
    }>
}

const HealthRecordSchema = new Schema<IHealthRecord>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    height: { type: Number },
    weight: { type: Number },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    medications: [{ type: String }],
    emergencyContact: { type: String },
    checkups: [{
        date: { type: Date, required: true },
        type: { type: String, required: true },
        notes: { type: String },
        doctor: { type: String },
    }]
}, { timestamps: true })

HealthRecordSchema.index({ tenantId: 1, studentId: 1 }, { unique: true })

export const HealthRecord = mongoose.models.HealthRecord ||
    mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema)