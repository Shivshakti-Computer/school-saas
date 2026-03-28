import mongoose, { Schema, Document } from 'mongoose'

export interface IDocumentTemplate extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    type: 'tc' | 'cc' | 'bonafide' | 'custom'
    content: string
    variables: string[]
    isDefault: boolean
    createdBy: mongoose.Types.ObjectId
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['tc', 'cc', 'bonafide', 'custom'], required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

DocumentTemplateSchema.index({ tenantId: 1, type: 1 })

export const DocumentTemplate = mongoose.models.DocumentTemplate ||
    mongoose.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema)