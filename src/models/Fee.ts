// FILE: src/models/Fee.ts
// ✅ UPDATED: Multi-tenant support
// ✅ BACKWARD COMPATIBLE: Existing school fees work as-is

import mongoose, { Schema, Document } from 'mongoose'

export interface IFeePayment {
  amount: number
  paymentMode: 'online' | 'cash' | 'cheque' | 'dd'
  razorpayPaymentId?: string
  receiptNumber: string
  paidAt: Date
  collectedBy?: mongoose.Types.ObjectId
  notes?: string
}

export interface IFee extends Document {
  tenantId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  
  // ✅ NEW — Institution context
  institutionType: 'school' | 'academy' | 'coaching'
  
  // ✅ NEW — Academy/Coaching fields
  courseId?: mongoose.Types.ObjectId
  batchId?: mongoose.Types.ObjectId
  enrollmentId?: mongoose.Types.ObjectId
  
  // ── Common fields (existing) ──
  structureId?: mongoose.Types.ObjectId
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
  payments: IFeePayment[]
  
  // ── Optional fee tracking ──
  isOptionalFee: boolean
  optionalItemLabels?: string[]
  academicYear?: string
  
  createdAt: Date
  updatedAt: Date
}

const FeePaymentSchema = new Schema({
  amount: { type: Number, required: true },
  paymentMode: { 
    type: String, 
    enum: ['online', 'cash', 'cheque', 'dd'], 
    required: true 
  },
  razorpayPaymentId: { type: String },
  receiptNumber: { type: String, required: true },
  paidAt: { type: Date, default: Date.now },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { _id: true })

const FeeSchema = new Schema<IFee>({
  tenantId: {
    type: Schema.Types.ObjectId, 
    ref: 'School', 
    required: true, 
    index: true,
  },
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  
  // ✅ NEW — Default 'school' for backward compatibility
  institutionType: {
    type: String,
    enum: ['school', 'academy', 'coaching'],
    default: 'school',
    required: true,
  },
  
  // ✅ NEW — Academy/Coaching fields
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course',
  },
  batchId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Batch',
  },
  enrollmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Enrollment',
  },
  
  // ── Existing fields ──
  structureId: { 
    type: Schema.Types.ObjectId, 
    ref: 'FeeStructure', 
    required: false 
  },
  amount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  lateFine: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'waived'],
    default: 'pending',
  },
  paidAmount: { type: Number, default: 0 },
  paidAt: { type: Date },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentMode: { 
    type: String, 
    enum: ['online', 'cash', 'cheque', 'dd'] 
  },
  receiptUrl: { type: String },
  receiptNumber: { type: String },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reminderSentAt: { type: Date },
  notes: { type: String },
  payments: [FeePaymentSchema],
  
  // ── Optional fees ──
  isOptionalFee: { type: Boolean, default: false },
  optionalItemLabels: { type: [String], default: null },
  academicYear: { type: String },

}, { timestamps: true })

// ── Indexes ──
FeeSchema.index({ tenantId: 1, studentId: 1, status: 1 })
FeeSchema.index({ tenantId: 1, dueDate: 1, status: 1 })
FeeSchema.index({ razorpayOrderId: 1 })
FeeSchema.index({ tenantId: 1, structureId: 1, optionalItemLabel: 1 })
FeeSchema.index({ tenantId: 1, isOptionalFee: 1, status: 1 })

// ✅ NEW — Academy/Coaching indexes
FeeSchema.index({ tenantId: 1, courseId: 1, status: 1 })
FeeSchema.index({ tenantId: 1, batchId: 1, status: 1 })
FeeSchema.index({ tenantId: 1, enrollmentId: 1 })
FeeSchema.index({ tenantId: 1, institutionType: 1, status: 1 })

export const Fee =
  mongoose.models.Fee ||
  mongoose.model<IFee>('Fee', FeeSchema)