// FILE: src/models/User.ts
// UPDATED: Added 'staff' role + allowedModules for granular access control
// BACKWARD COMPATIBLE — all existing data works as-is

import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'admin' | 'teacher' | 'staff' | 'student' | 'parent' | 'superadmin'

export interface IUser extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    email?: string
    phone: string
    role: UserRole
    password: string
    // Role-specific fields
    studentRef?: mongoose.Types.ObjectId
    subjects?: string[]
    class?: string
    section?: string
    employeeId?: string
    pushToken?: string
    // ── NEW: Staff Module Permissions ──
    // Only used when role = 'staff'
    // Empty array = no module access (can only view dashboard)
    // Admin always has full access (not checked)
    // Teacher has access based on moduleRegistry roles
    allowedModules?: string[]
    isActive: boolean
    lastLogin?: Date
}

const UserSchema = new Schema<IUser>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    phone: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'staff', 'student', 'parent', 'superadmin'],
        required: true,
    },
    password: { type: String, required: true },
    studentRef: { type: Schema.Types.ObjectId, ref: 'Student' },
    subjects: [String],
    class: { type: String },
    section: { type: String },
    employeeId: { type: String },
    pushToken: { type: String },
    // ── NEW FIELD ──
    allowedModules: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
}, { timestamps: true })

// Compound indexes
UserSchema.index({ tenantId: 1, role: 1 })
UserSchema.index({ tenantId: 1, phone: 1 })
UserSchema.index({ tenantId: 1, employeeId: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)