import mongoose, { Schema, Document } from 'mongoose'

export interface IVisitor extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    phone: string
    purpose: string
    toMeet: string
    inTime: Date
    outTime?: Date
    status: 'waiting' | 'inside' | 'completed'
    remarks?: string
    gatePassNo: string
    createdBy: mongoose.Types.ObjectId
}

const VisitorSchema = new Schema<IVisitor>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    purpose: { type: String, required: true },
    toMeet: { type: String, required: true },
    inTime: { type: Date, default: Date.now },
    outTime: { type: Date },
    status: { type: String, enum: ['waiting', 'inside', 'completed'], default: 'waiting' },
    remarks: { type: String },
    gatePassNo: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

VisitorSchema.index({ tenantId: 1, createdAt: -1 })
VisitorSchema.index({ tenantId: 1, status: 1 })

export const Visitor = mongoose.models.Visitor ||
    mongoose.model<IVisitor>('Visitor', VisitorSchema)