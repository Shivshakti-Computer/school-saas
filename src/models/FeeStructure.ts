// FILE: src/models/FeeStructure.ts
// ✅ UPDATED: Multi-tenant support (School, Academy, Coaching)
// ✅ BACKWARD COMPATIBLE: Existing school structures work as-is

import mongoose, { Schema, Document } from 'mongoose'

export interface IFeeItem {
  label: string
  amount: number
  isOptional: boolean
}

export interface IFeeStructure extends Document {
  tenantId: mongoose.Types.ObjectId
  
  // ✅ NEW — Institution context
  institutionType: 'school' | 'academy' | 'coaching'
  
  // ── School fields (optional for academy/coaching) ──
  class?: string             // "10" | "all" | "9,10"
  section?: string           // "A" | "all"
  stream?: string            // "science" | "commerce" | "arts" | ""
  
  // ── Academy/Coaching fields (optional for school) ──
  courseId?: mongoose.Types.ObjectId
  
  // ── Common fields ──
  name: string
  academicYear: string
  term: string
  items: IFeeItem[]
  totalAmount: number        // Mandatory items only
  dueDate: Date
  
  // ── Late fine ──
  lateFinePerDay: number
  lateFineType: 'fixed' | 'percent'
  maxLateFine: number
  
  // ── Settings ──
  isActive: boolean
  autoAssign: boolean
  createdBy: mongoose.Types.ObjectId
  
  createdAt: Date
  updatedAt: Date
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  tenantId: { 
    type: Schema.Types.ObjectId, 
    ref: 'School', 
    required: true, 
    index: true 
  },
  
  // ✅ NEW — Default 'school' for backward compatibility
  institutionType: {
    type: String,
    enum: ['school', 'academy', 'coaching'],
    default: 'school',
    required: true,
  },
  
  // ── School fields ──
  class: { type: String },
  section: { type: String, default: 'all' },
  stream: { type: String, default: '' },
  
  // ── Academy/Coaching fields ──
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course',
  },
  
  // ── Common fields ──
  name: { type: String, required: true },
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
  lateFineType: { 
    type: String, 
    enum: ['fixed', 'percent'], 
    default: 'fixed' 
  },
  maxLateFine: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true },
  autoAssign: { type: Boolean, default: true },
  
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { timestamps: true })

// ── Indexes ──
FeeStructureSchema.index({ tenantId: 1, class: 1, stream: 1, academicYear: 1 })
FeeStructureSchema.index({ tenantId: 1, courseId: 1, academicYear: 1 })
FeeStructureSchema.index({ tenantId: 1, institutionType: 1, isActive: 1 })

// ✅ Validation: School must have class, Academy/Coaching must have courseId
FeeStructureSchema.pre('save', function() {
  if (this.institutionType === 'school') {
    if (!this.class) {
      return new Error('School fee structure must have a class')
    }
  } else {
    // Academy/Coaching
    if (!this.courseId) {
      return new Error('Academy/Coaching fee structure must have a courseId')
    }
  }
})

export const FeeStructure = mongoose.models.FeeStructure ||
  mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema)