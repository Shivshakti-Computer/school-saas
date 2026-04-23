// FILE: src/models/Franchise.ts
// Franchise management for Academy/Coaching
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface IFranchise extends Document {
    tenantId: mongoose.Types.ObjectId

    // Basic Info
    franchiseCode: string
    franchiseName: string

    // Location
    address: string
    city: string
    state: string
    pincode: string
    landmark?: string
    mapUrl?: string

    // Contact
    phone: string
    email?: string
    alternatePhone?: string

    // Franchise Owner
    ownerName: string
    ownerPhone: string
    ownerEmail?: string

    // Branch Manager
    managerName?: string
    managerPhone?: string
    managerEmail?: string
    managerUserId?: mongoose.Types.ObjectId  // Link to User (staff)

    // Operational
    startDate: Date
    agreementEndDate?: Date
    status: 'active' | 'inactive' | 'suspended' | 'closed'

    // Capacity
    maxStudents?: number
    currentStudents: number

    // Courses offered (subset of main academy)
    allowedCourses: mongoose.Types.ObjectId[]

    // Settings
    hasOwnBatches: boolean  // Can create own batches or use central batches
    hasOwnFees: boolean     // Can set own course fees

    // Metadata
    logo?: string
    description?: string
    facilities: string[]
    photos: string[]

    // Financial
    royaltyPercentage?: number  // % of revenue to main branch
    securityDeposit?: number

    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const FranchiseSchema = new Schema<IFranchise>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },

    franchiseCode: { type: String, required: true },
    franchiseName: { type: String, required: true },

    // Location
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    mapUrl: { type: String },

    // Contact
    phone: { type: String, required: true },
    email: { type: String },
    alternatePhone: { type: String },

    // Owner
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String },

    // Manager
    managerName: { type: String },
    managerPhone: { type: String },
    managerEmail: { type: String },
    managerUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    // Operational
    startDate: { type: Date, required: true },
    agreementEndDate: { type: Date },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'closed'],
        default: 'active',
    },

    // Capacity
    maxStudents: { type: Number },
    currentStudents: { type: Number, default: 0 },

    // Courses
    allowedCourses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course',
    }],

    // Settings
    hasOwnBatches: { type: Boolean, default: false },
    hasOwnFees: { type: Boolean, default: false },

    // Metadata
    logo: { type: String },
    description: { type: String },
    facilities: { type: [String], default: [] },
    photos: { type: [String], default: [] },

    // Financial
    royaltyPercentage: { type: Number },
    securityDeposit: { type: Number },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

// Indexes
FranchiseSchema.index({ tenantId: 1, franchiseCode: 1 }, { unique: true })
FranchiseSchema.index({ tenantId: 1, status: 1 })
FranchiseSchema.index({ tenantId: 1, city: 1 })

export const Franchise =
    mongoose.models.Franchise ||
    mongoose.model<IFranchise>('Franchise', FranchiseSchema)