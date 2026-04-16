// -------------------------------------------------------------
// FILE: src/models/FeeStructure.ts — UPDATED with more fields
// -------------------------------------------------------------

import mongoose, { Schema, Document } from 'mongoose'

export interface IFeeItem {
  label: string
  amount: number
  isOptional: boolean   // optional fees (transport, hostel)
}

export interface IFeeStructure extends Document {
  tenantId: mongoose.Types.ObjectId
  name: string             // "Term 1 2025-26"
  class: string             // "10" | "all" | "9,10" (comma-separated)
  section?: string             // "A" | "all"
  stream?: string          // ✅ ADD — blank = all streams, 'Science'/'Commerce'/'Arts' = specific
  academicYear: string             // "2025-26"
  term: string             // "Term 1" | "Monthly" | "Annual"
  items: IFeeItem[]
  totalAmount: number
  dueDate: Date
  lateFinePerDay: number
  lateFineType: 'fixed' | 'percent'  // fixed amount ya percentage
  maxLateFine: number               // cap on late fine (0 = no cap)
  isActive: boolean
  autoAssign: boolean              // new students ko auto-assign karo
  createdBy: mongoose.Types.ObjectId
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, default: 'all' },
  stream: { type: String, default: '' },   // ✅ ADD — '' = all streams
  academicYear: { type: String, required: true },
  term: { type: String, default: 'Term 1' },
  items: [{
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    isOptional: { type: Boolean, default: false },
  }],
  totalAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  lateFinePerDay: { type: Number, default: 0 },
  lateFineType: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
  maxLateFine: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  autoAssign: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

FeeStructureSchema.index({ tenantId: 1, class: 1, stream: 1, academicYear: 1 })

export const FeeStructure = mongoose.models.FeeStructure ||
  mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema)