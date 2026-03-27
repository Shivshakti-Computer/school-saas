import mongoose, { Schema, Document } from 'mongoose'

export interface IStudent extends Document {
    tenantId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId        // linked User account
    rollNo: string
    class: string
    section: string
    fatherName: string
    motherName?: string
    parentPhone: string
    parentEmail?: string
    address: string
    dateOfBirth: Date
    gender: 'male' | 'female' | 'other'
    photo?: string                         // Cloudinary URL
    documents: Array<{
        name: string
        url: string
        uploadedAt: Date
    }>
    admissionDate: Date
    admissionNo: string
    status: 'active' | 'inactive' | 'transferred' | 'graduated'
    bloodGroup?: string
    emergencyContact?: string
}

const StudentSchema = new Schema<IStudent>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rollNo: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String },
    address: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    photo: { type: String },
    documents: [{ name: String, url: String, uploadedAt: Date }],
    admissionDate: { type: Date, required: true },
    admissionNo: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'transferred', 'graduated'], default: 'active' },
    bloodGroup: { type: String },
    emergencyContact: { type: String },
}, { timestamps: true })

StudentSchema.index({ tenantId: 1, class: 1, section: 1 })
StudentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true })

export const Student = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema)