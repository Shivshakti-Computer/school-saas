// src/models/Fee.ts
// Sirf per-student fee record
// FeeStructure alag file mein hai → src/models/FeeStructure.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface IFee extends Document {
    tenantId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    structureId: mongoose.Types.ObjectId
    amount: number
    discount: number
    lateFine: number
    finalAmount: number
    dueDate: Date
    status: 'pending' | 'paid' | 'partial' | 'waived'
    paidAmount: number
    paidAt?: Date
    razorpayOrderId?: string
    razorpayPaymentId?: string
    paymentMode?: 'online' | 'cash' | 'cheque' | 'dd'
    receiptUrl?: string
    receiptNumber?: string
    collectedBy?: mongoose.Types.ObjectId
    reminderSentAt?: Date
    notes?: string
}

const FeeSchema = new Schema<IFee>({
    tenantId: {
        type: Schema.Types.ObjectId, ref: 'School', required: true, index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    structureId: { type: Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    lateFine: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
        type: String, enum: ['pending', 'paid', 'partial', 'waived'], default: 'pending',
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentMode: { type: String, enum: ['online', 'cash', 'cheque', 'dd'] },
    receiptUrl: { type: String },
    receiptNumber: { type: String },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reminderSentAt: { type: Date },
    notes: { type: String },
}, { timestamps: true })

FeeSchema.index({ tenantId: 1, studentId: 1, status: 1 })
FeeSchema.index({ tenantId: 1, dueDate: 1, status: 1 })
FeeSchema.index({ razorpayOrderId: 1 })

export const Fee =
    mongoose.models.Fee ||
    mongoose.model<IFee>('Fee', FeeSchema)