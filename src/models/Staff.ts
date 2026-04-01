// FILE: src/models/Staff.ts
// ENHANCED: Real school HR fields — Indian school context
// Links to User model for auth, stores detailed HR/professional info

import mongoose, { Schema, Document } from 'mongoose'

export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'resigned' | 'terminated'
export type StaffGender = 'male' | 'female' | 'other'
export type StaffMaritalStatus = 'single' | 'married' | 'widowed' | 'divorced'
export type StaffCategory = 'teaching' | 'non_teaching' | 'admin' | 'support'

export interface IStaffDocument {
    name: string
    url: string
    type: string // 'aadhar' | 'pan' | 'resume' | 'photo' | 'certificate' | 'other'
    uploadedAt: Date
}

export interface IStaff extends Document {
    tenantId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId    // linked User account for login

    // ── Personal Information ──
    employeeId: string                 // auto or manual: EMP-001
    firstName: string
    lastName: string
    fullName: string                   // virtual or stored for search
    gender: StaffGender
    dateOfBirth?: Date
    bloodGroup?: string
    maritalStatus?: StaffMaritalStatus
    nationality?: string
    religion?: string
    category?: string                  // General / OBC / SC / ST
    motherTongue?: string
    photo?: string                     // URL to photo

    // ── Contact Information ──
    phone: string                      // primary (same as User.phone)
    alternatePhone?: string
    email?: string
    personalEmail?: string

    // ── Address ──
    currentAddress: string
    permanentAddress?: string
    city?: string
    state?: string
    pincode?: string

    // ── Professional Information ──
    staffCategory: StaffCategory       // teaching / non_teaching / admin / support
    designation: string                // "PGT", "TGT", "PRT", "Lab Assistant", "Clerk"
    department: string                 // "Science", "Mathematics", "Administration", "Accounts"
    qualification: string              // "B.Ed", "M.Sc", "MBA"
    specialization?: string            // "Physics", "Computer Science"
    experience?: number                // years of experience
    previousSchool?: string
    joiningDate: Date
    confirmationDate?: Date
    probationEndDate?: Date

    // ── Teaching Details (if staffCategory = 'teaching') ──
    subjects?: string[]                // subjects they teach
    classes?: string[]                 // which classes: ["6", "7", "8"]
    sections?: string[]                // which sections: ["A", "B"]
    isClassTeacher?: boolean
    classTeacherOf?: {                 // class teacher assignment
        class: string
        section: string
    }

    // ── Module Permissions ──
    // Which admin modules this staff can access
    // e.g., ['students', 'fees', 'attendance']
    allowedModules: string[]

    // ── Salary & Bank Details ──
    salaryGrade?: string               // "Level-1", "Level-2"
    basicSalary: number                // monthly basic
    allowances?: {
        hra?: number                     // House Rent Allowance
        da?: number                      // Dearness Allowance
        ta?: number                      // Transport Allowance
        medical?: number
        special?: number
        other?: number
    }
    deductions?: {
        pf?: number                      // Provident Fund
        esi?: number                     // Employee State Insurance
        professionalTax?: number
        tds?: number
        other?: number
    }
    grossSalary?: number               // computed
    netSalary?: number                 // computed
    bankName?: string
    bankBranch?: string
    accountNumber?: string
    ifscCode?: string
    panNumber?: string
    pfNumber?: string
    esiNumber?: string
    uanNumber?: string                 // Universal Account Number (PF)

    // ── ID Documents ──
    aadharNumber?: string
    voterIdNumber?: string

    // ── Emergency Contact ──
    emergencyContactName: string
    emergencyContactRelation?: string
    emergencyContactPhone: string

    // ── Documents ──
    documents: IStaffDocument[]

    // ── Leave Balance ──
    leaveBalance: {
        casual: number                   // CL - typically 12/year
        sick: number                     // SL - typically 10/year
        earned: number                   // EL - accrued
        maternity?: number
        paternity?: number
        unpaid: number                   // track unpaid leaves taken
    }

    // ── Status & Metadata ──
    status: StaffStatus
    statusReason?: string              // reason for inactive/resigned/terminated
    relievingDate?: Date
    exitRemarks?: string

    // ── Computed ──
    createdAt: Date
    updatedAt: Date
}

const StaffDocumentSchema = new Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
        type: String,
        enum: ['aadhar', 'pan', 'resume', 'photo', 'certificate', 'qualification', 'experience', 'other'],
        default: 'other',
    },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const StaffSchema = new Schema<IStaff>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // ── Personal ──
    employeeId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: '' },
    fullName: { type: String, required: true, index: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    maritalStatus: { type: String, enum: ['single', 'married', 'widowed', 'divorced', ''] },
    nationality: { type: String, default: 'Indian' },
    religion: { type: String },
    category: { type: String },
    motherTongue: { type: String },
    photo: { type: String },

    // ── Contact ──
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    email: { type: String },
    personalEmail: { type: String },

    // ── Address ──
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // ── Professional ──
    staffCategory: {
        type: String,
        enum: ['teaching', 'non_teaching', 'admin', 'support'],
        required: true,
    },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String },
    experience: { type: Number, default: 0 },
    previousSchool: { type: String },
    joiningDate: { type: Date, required: true },
    confirmationDate: { type: Date },
    probationEndDate: { type: Date },

    // ── Teaching ──
    subjects: [String],
    classes: [String],
    sections: [String],
    isClassTeacher: { type: Boolean, default: false },
    classTeacherOf: {
        class: { type: String },
        section: { type: String },
    },

    // ── Module Permissions ──
    allowedModules: { type: [String], default: [] },

    // ── Salary ──
    salaryGrade: { type: String },
    basicSalary: { type: Number, default: 0 },
    allowances: {
        hra: { type: Number, default: 0 },
        da: { type: Number, default: 0 },
        ta: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        special: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
    },
    deductions: {
        pf: { type: Number, default: 0 },
        esi: { type: Number, default: 0 },
        professionalTax: { type: Number, default: 0 },
        tds: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
    },
    grossSalary: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    bankName: { type: String },
    bankBranch: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    panNumber: { type: String },
    pfNumber: { type: String },
    esiNumber: { type: String },
    uanNumber: { type: String },

    // ── ID Documents ──
    aadharNumber: { type: String },
    voterIdNumber: { type: String },

    // ── Emergency ──
    emergencyContactName: { type: String, required: true },
    emergencyContactRelation: { type: String },
    emergencyContactPhone: { type: String, required: true },

    // ── Documents ──
    documents: [StaffDocumentSchema],

    // ── Leave Balance ──
    leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        earned: { type: Number, default: 0 },
        maternity: { type: Number, default: 0 },
        paternity: { type: Number, default: 0 },
        unpaid: { type: Number, default: 0 },
    },

    // ── Status ──
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated'],
        default: 'active',
    },
    statusReason: { type: String },
    relievingDate: { type: Date },
    exitRemarks: { type: String },
}, { timestamps: true })

// Indexes
StaffSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true })
StaffSchema.index({ tenantId: 1, status: 1 })
StaffSchema.index({ tenantId: 1, staffCategory: 1 })
StaffSchema.index({ tenantId: 1, department: 1 })
StaffSchema.index({ tenantId: 1, fullName: 'text' })

// Pre-save: compute gross & net salary
StaffSchema.pre('save', function () {
    if (this.isModified('basicSalary') || this.isModified('allowances') || this.isModified('deductions')) {
        const a = this.allowances || {}
        const d = this.deductions || {}

        const totalAllowances = (a.hra || 0) + (a.da || 0) + (a.ta || 0) +
            (a.medical || 0) + (a.special || 0) + (a.other || 0)
        const totalDeductions = (d.pf || 0) + (d.esi || 0) +
            (d.professionalTax || 0) + (d.tds || 0) + (d.other || 0)

        this.grossSalary = this.basicSalary + totalAllowances
        this.netSalary = this.grossSalary - totalDeductions
    }
})

export const Staff =
    mongoose.models.Staff ||
    mongoose.model<IStaff>('Staff', StaffSchema)