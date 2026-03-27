// src/models/Staff.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface IStaff extends Document {
    tenantId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId   // linked User account
    employeeId: string
    designation: string   // "Class Teacher", "Principal", "Librarian"
    department: string   // "Science Dept", "Administration"
    subjects?: string[] // agar teacher hai
    classes?: string[] // which classes they teach
    joiningDate: Date
    salary: number   // monthly gross
    bankAccount?: string
    ifscCode?: string
    panNumber?: string
    address: string
    emergencyContact: string
    documents: Array<{ name: string; url: string }>
    leaveBalance: {
        casual: number
        sick: number
        earned: number
    }
    status: 'active' | 'inactive' | 'resigned' | 'terminated'
}

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
    },
    employeeId: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    subjects: [String],
    classes: [String],
    joiningDate: { type: Date, required: true },
    salary: { type: Number, required: true },
    bankAccount: { type: String },
    ifscCode: { type: String },
    panNumber: { type: String },
    address: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    documents: [
        {
            name: { type: String },
            url: { type: String },
        },
    ],
    leaveBalance: {
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 10 },
        earned: { type: Number, default: 0 },
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'resigned', 'terminated'],
        default: 'active',
    },
}, { timestamps: true })

StaffSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true })
StaffSchema.index({ tenantId: 1, status: 1 })

export const Staff =
    mongoose.models.Staff ||
    mongoose.model<IStaff>('Staff', StaffSchema)