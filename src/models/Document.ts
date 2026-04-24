// FILE: src/models/Document.ts
import mongoose, { Schema, Document } from 'mongoose'

export type DocumentType = 'tc' | 'cc' | 'bonafide' | 'custom'
export type IssuedDocStatus = 'issued' | 'revoked'

export interface IDocumentTemplate extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    type: DocumentType
    content: string
    variables: string[]
    isDefault: boolean
    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

export interface IIssuedDocument extends Document {
    tenantId: mongoose.Types.ObjectId
    templateId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    studentName: string
    studentAdmissionNo: string
    documentType: DocumentType
    serialNo: string
    issuedBy: mongoose.Types.ObjectId
    issuedByName: string
    status: IssuedDocStatus
    // ✅ NEW: Optional PDF storage
    pdfUrl?: string
    savedToStorage: boolean
    revokedAt?: Date
    revokedReason?: string
    createdAt: Date
    updatedAt: Date
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['tc', 'cc', 'bonafide', 'custom'],
        required: true,
    },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isDefault: { type: Boolean, default: false },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

DocumentTemplateSchema.index({ tenantId: 1, type: 1 })

const IssuedDocumentSchema = new Schema<IIssuedDocument>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'DocumentTemplate',
        required: true,
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    studentName: { type: String, required: true },
    studentAdmissionNo: { type: String, required: true },
    documentType: {
        type: String,
        enum: ['tc', 'cc', 'bonafide', 'custom'],
        required: true,
    },
    serialNo: { type: String, required: true },
    issuedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    issuedByName: { type: String, required: true },
    status: {
        type: String,
        enum: ['issued', 'revoked'],
        default: 'issued',
    },
    // ✅ NEW FIELDS
    pdfUrl: { type: String },
    savedToStorage: { type: Boolean, default: false },
    revokedAt: { type: Date },
    revokedReason: { type: String },
}, { timestamps: true })

IssuedDocumentSchema.index({ tenantId: 1, documentType: 1 })
IssuedDocumentSchema.index({ tenantId: 1, studentId: 1 })
IssuedDocumentSchema.index({ tenantId: 1, serialNo: 1 }, { unique: true })

export const DocumentTemplate =
    mongoose.models.DocumentTemplate ||
    mongoose.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema)

export const IssuedDocument =
    mongoose.models.IssuedDocument ||
    mongoose.model<IIssuedDocument>('IssuedDocument', IssuedDocumentSchema)