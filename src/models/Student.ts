// FILE: src/models/Student.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IStudent extends Document {
    tenantId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    
    // ── Admission Info ──
    admissionNo: string          // AUTO: SCH/2024-25/0001
    rollNo: string               // AUTO: Section-wise sequential
    academicYear: string         // "2024-25"
    admissionDate: Date
    admissionClass: string       // Jis class me admission hua
    
    // ── Current Academic Info ──
    class: string
    section: string
    stream?: string
    
    // ── Personal Info ──
    dateOfBirth: Date
    gender: 'male' | 'female' | 'other'
    bloodGroup?: string
    nationality: string
    religion?: string
    category: 'general' | 'obc' | 'sc' | 'st' | 'other'
    photo?: string
    
    // ── Family Info ──
    fatherName: string
    fatherOccupation?: string
    fatherPhone?: string
    motherName?: string
    motherOccupation?: string
    motherPhone?: string
    parentPhone: string          // Primary contact
    parentEmail?: string
    
    // ── Address ──
    address: string
    city?: string
    state?: string
    pincode?: string
    
    // ── Emergency ──
    emergencyContact?: string
    emergencyName?: string
    
    // ── Documents ──
    documents: Array<{
        name: string
        url: string
        uploadedAt: Date
    }>
    
    // ── Previous School ──
    previousSchool?: string
    previousClass?: string
    tcNumber?: string            // Transfer Certificate
    
    // ── Session History (for promotion) ──
    sessionHistory: Array<{
        academicYear: string
        class: string
        section: string
        rollNo: string
        promotedAt?: Date
        result?: 'promoted' | 'detained' | 'transferred'
    }>
    
    // ── Status ──
    status: 'active' | 'inactive' | 'transferred' | 'graduated'
    leftDate?: Date
    leftReason?: string
}

const StudentSchema = new Schema<IStudent>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Admission Info
    admissionNo: { type: String, required: true },
    rollNo: { type: String, required: true },
    academicYear: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    admissionClass: { type: String, required: true },

    // Current Academic
    class: { type: String, required: true },
    section: { type: String, required: true },
    stream:  { type: String, enum: ['science', 'commerce', 'arts', 'vocational', ''], default: '' }, // ✅ ADD

    // Personal
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''] },
    nationality: { type: String, default: 'Indian' },
    religion: { type: String },
    category: { 
        type: String, 
        enum: ['general', 'obc', 'sc', 'st', 'other'], 
        default: 'general' 
    },
    photo: { type: String },

    // Family
    fatherName: { type: String, required: true },
    fatherOccupation: { type: String },
    fatherPhone: { type: String },
    motherName: { type: String },
    motherOccupation: { type: String },
    motherPhone: { type: String },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String },

    // Address
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // Emergency
    emergencyContact: { type: String },
    emergencyName: { type: String },

    // Documents
    documents: [{ name: String, url: String, uploadedAt: Date }],

    // Previous School
    previousSchool: { type: String },
    previousClass: { type: String },
    tcNumber: { type: String },

    // Session History
    sessionHistory: [{
        academicYear: String,
        class: String,
        section: String,
        rollNo: String,
        promotedAt: Date,
        result: { 
            type: String, 
            enum: ['promoted', 'detained', 'transferred'] 
        },
    }],

    // Status
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'transferred', 'graduated'], 
        default: 'active' 
    },
    leftDate: { type: Date },
    leftReason: { type: String },

}, { timestamps: true })

// Indexes
StudentSchema.index({ tenantId: 1, class: 1, section: 1 })
StudentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true })
StudentSchema.index({ tenantId: 1, academicYear: 1, class: 1, section: 1, rollNo: 1 })
StudentSchema.index({ tenantId: 1, status: 1 })

export const Student = mongoose.models.Student 
    || mongoose.model<IStudent>('Student', StudentSchema)