import mongoose, { Schema, Document } from 'mongoose'

export interface IAlumni extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    phone: string
    email?: string
    batch: number
    currentOccupation?: string
    currentLocation?: string
    linkedin?: string
    notes?: string
    createdBy: mongoose.Types.ObjectId
}

const AlumniSchema = new Schema<IAlumni>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    batch: { type: Number, required: true },
    currentOccupation: { type: String },
    currentLocation: { type: String },
    linkedin: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

AlumniSchema.index({ tenantId: 1, batch: 1 })

export const Alumni = mongoose.models.Alumni ||
    mongoose.model<IAlumni>('Alumni', AlumniSchema)