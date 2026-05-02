// FILE: src/models/Franchise.ts
// SAFE UPDATE: Adding certificate capabilities to franchises
// Existing franchises will continue working without migration
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

// ────────────────────────────────────────────────────────────
// ✅ NEW INTERFACES (FRANCHISE-SPECIFIC)
// ────────────────────────────────────────────────────────────

/**
 * Franchise-level accreditations
 * Local certifications, partnerships, awards
 */
export interface IFranchiseAccreditation {
  name: string
  logoUrl: string
  registrationNo?: string
  issuedBy?: string
  validFrom?: Date
  validUntil?: Date
  isActive: boolean
  displayOrder: number
}

export interface IFranchiseAccreditations {
  registrations: IFranchiseAccreditation[]   // MSME, Local licenses
  partnerships: IFranchiseAccreditation[]    // Local tie-ups
  awards: IFranchiseAccreditation[]          // Local achievements
}

/**
 * Franchise certificate settings
 * Controls franchise-specific certificate generation
 */
export interface IFranchiseCertificateSettings {
  enableOwnBranding: boolean          // Show franchise logo on certificates
  showParentBranding: boolean         // Also show parent academy logo
  enableDigitalSignature: boolean
  digitalSignatureUrl?: string
  signatureName?: string
  signatureDesignation?: string
  enableQRCode: boolean
  qrCodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center'
  customCertificatePrefix?: string    // Override certificate number prefix
  allowIndependentAccreditations: boolean  // Can add own accreditations
  inheritParentAccreditations: boolean     // Show parent's accreditations too
}

// ────────────────────────────────────────────────────────────
// UPDATE: IFranchise Interface
// ────────────────────────────────────────────────────────────

export interface IFranchise extends Document {
    tenantId: mongoose.Types.ObjectId

    // Basic Info (existing)
    franchiseCode: string
    franchiseName: string

    // Location (existing)
    address: string
    city: string
    state: string
    pincode: string
    landmark?: string
    mapUrl?: string

    // Contact (existing)
    phone: string
    email?: string
    alternatePhone?: string

    // Franchise Owner (existing)
    ownerName: string
    ownerPhone: string
    ownerEmail?: string

    // Branch Manager (existing)
    managerName?: string
    managerPhone?: string
    managerEmail?: string
    managerUserId?: mongoose.Types.ObjectId

    // Operational (existing)
    startDate: Date
    agreementEndDate?: Date
    status: 'active' | 'inactive' | 'suspended' | 'closed'

    // Capacity (existing)
    maxStudents?: number
    currentStudents: number

    // Courses (existing)
    allowedCourses: mongoose.Types.ObjectId[]

    // Settings (existing)
    hasOwnBatches: boolean
    hasOwnFees: boolean

    // Metadata (existing)
    logo?: string
    description?: string
    facilities: string[]
    photos: string[]

    // ✅ NEW OPTIONAL FIELDS (backward compatible)
    accreditations?: IFranchiseAccreditations
    certificateSettings?: IFranchiseCertificateSettings

    // Financial (existing)
    royaltyPercentage?: number
    securityDeposit?: number

    createdBy: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

// ────────────────────────────────────────────────────────────
// ✅ NEW SCHEMAS
// ────────────────────────────────────────────────────────────

const FranchiseAccreditationSchema = new Schema<IFranchiseAccreditation>({
  name: { type: String, required: true },
  logoUrl: { type: String, required: true },
  registrationNo: { type: String },
  issuedBy: { type: String },
  validFrom: { type: Date },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { _id: false })

const FranchiseAccreditationsSchema = new Schema<IFranchiseAccreditations>({
  registrations: { type: [FranchiseAccreditationSchema], default: [] },
  partnerships: { type: [FranchiseAccreditationSchema], default: [] },
  awards: { type: [FranchiseAccreditationSchema], default: [] },
}, { _id: false })

const FranchiseCertificateSettingsSchema = new Schema<IFranchiseCertificateSettings>({
  enableOwnBranding: { type: Boolean, default: true },
  showParentBranding: { type: Boolean, default: true },
  enableDigitalSignature: { type: Boolean, default: false },
  digitalSignatureUrl: { type: String },
  signatureName: { type: String },
  signatureDesignation: { type: String, default: 'Branch Head' },
  enableQRCode: { type: Boolean, default: true },
  qrCodePosition: { 
    type: String, 
    enum: ['bottom-left', 'bottom-right', 'bottom-center'],
    default: 'bottom-right'
  },
  customCertificatePrefix: { type: String },
  allowIndependentAccreditations: { type: Boolean, default: true },
  inheritParentAccreditations: { type: Boolean, default: true },
}, { _id: false })

// ────────────────────────────────────────────────────────────
// UPDATE: FranchiseSchema (Add new optional fields)
// ────────────────────────────────────────────────────────────

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

    // ✅ NEW OPTIONAL FIELDS (backward compatible — defaults provided)
    accreditations: {
        type: FranchiseAccreditationsSchema,
        default: () => ({
            registrations: [],
            partnerships: [],
            awards: [],
        }),
    },
    certificateSettings: {
        type: FranchiseCertificateSettingsSchema,
        default: () => ({
            enableOwnBranding: true,
            showParentBranding: true,
            enableDigitalSignature: false,
            enableQRCode: true,
            qrCodePosition: 'bottom-right',
            allowIndependentAccreditations: true,
            inheritParentAccreditations: true,
        }),
    },

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