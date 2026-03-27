import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'superadmin'

export interface IUser extends Document {
    tenantId: mongoose.Types.ObjectId  // School._id
    name: string
    email?: string
    phone: string
    role: UserRole
    password: string
    // Role-specific fields
    studentRef?: mongoose.Types.ObjectId   // parent → child student
    subjects?: string[]                     // teacher → which subjects
    class?: string                          // student/teacher → class
    section?: string
    employeeId?: string                     // teacher/staff
    pushToken?: string                      // PWA push notifications
    isActive: boolean
    lastLogin?: Date
}

const UserSchema = new Schema<IUser>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student', 'parent', 'superadmin'], required: true },
    password: { type: String, required: true },
    studentRef: { type: Schema.Types.ObjectId, ref: 'Student' },
    subjects: [String],
    class: { type: String },
    section: { type: String },
    employeeId: { type: String },
    pushToken: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
}, { timestamps: true })

// Compound index for fast tenant queries
UserSchema.index({ tenantId: 1, role: 1 })
UserSchema.index({ tenantId: 1, phone: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)