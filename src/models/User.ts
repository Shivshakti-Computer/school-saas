// FILE: src/models/User.ts

import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'admin' | 'teacher' | 'staff' | 'student' | 'parent' | 'superadmin'

export interface IUser extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    email?: string
    // ✅ Optional — chote bachhe ka phone nahi hota
    phone?: string | null
    // ✅ AdmissionNo se bhi login — phone nahi to ye use hoga
    admissionNo?: string | null
    role: UserRole
    password: string
    // ✅ Array — ek parent ke multiple bachhe
    studentRef?: mongoose.Types.ObjectId[]
    subjects?: string[]
    class?: string
    section?: string
    employeeId?: string
    pushToken?: string
    allowedModules?: string[]
    isActive: boolean
    lastLogin?: Date
}

const UserSchema = new Schema<IUser>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    name: { type: String, required: true },
    email: { type: String, sparse: true },

    // ✅ Phone optional — chote bachhe ka nahi hota
    // sparse: true → multiple null values allowed (unique index skip karta hai null ke liye)
    phone: {
        type: String,
        default: null,
        sparse: true,
    },

    // ✅ NEW — AdmissionNo se login support
    admissionNo: {
        type: String,
        default: null,
        sparse: true,
    },

    role: {
        type: String,
        enum: ['admin', 'teacher', 'staff', 'student', 'parent', 'superadmin'],
        required: true,
    },
    password: { type: String, required: true },

    // ✅ Array — siblings support (ek parent ke multiple bachhe)
    studentRef: [{ type: Schema.Types.ObjectId, ref: 'Student' }],

    subjects: [String],
    class: { type: String },
    section: { type: String },
    employeeId: { type: String },
    pushToken: { type: String },
    allowedModules: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },

}, { timestamps: true })

// ── Indexes ──
UserSchema.index({ tenantId: 1, role: 1 })
UserSchema.index({ tenantId: 1, employeeId: 1 })

// ✅ Phone unique — sirf jab phone present ho (null skip)
UserSchema.index(
    { tenantId: 1, phone: 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { phone: { $type: 'string' } },
    }
)

// ✅ AdmissionNo unique — sirf jab present ho
UserSchema.index(
    { tenantId: 1, admissionNo: 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { admissionNo: { $type: 'string' } },
    }
)

export const User = mongoose.models.User
    || mongoose.model<IUser>('User', UserSchema)