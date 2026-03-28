import mongoose, { Schema, Document } from 'mongoose'

export interface ICertificate extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    type: 'merit' | 'participation' | 'achievement' | 'custom'
    template: string
    backgroundImage?: string
    fields: Array<{ name: string; type: 'text' | 'date' | 'number' }>
    createdBy: mongoose.Types.ObjectId
}

const CertificateSchema = new Schema<ICertificate>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['merit', 'participation', 'achievement', 'custom'], required: true },
    template: { type: String, required: true },
    backgroundImage: { type: String },
    fields: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['text', 'date', 'number'], required: true },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

CertificateSchema.index({ tenantId: 1, createdAt: -1 })

export const Certificate = mongoose.models.Certificate ||
    mongoose.model<ICertificate>('Certificate', CertificateSchema)