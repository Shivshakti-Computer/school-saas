// FILE: src/models/MessageCredit.ts
// Credit balance + add-on student/teacher tracking per school
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export interface IMessageCredit extends Document {
    tenantId: mongoose.Types.ObjectId

    // ── Credit Balance ──
    balance: number              // Current available credits
    totalEarned: number          // Lifetime credits received
    totalUsed: number            // Lifetime credits consumed
    totalExpired: number         // Credits that expired (rollover)

    // ── Monthly Free Credit Tracking ──
    monthlyCredits: {
        month: string              // "2025-01" format
        plan: string
        creditsGiven: number
        creditsFromPrev: number    // Rolled over from last month
        creditsExpiredAt?: Date
    }[]

    // ── Add-on: Extra Students ──
    extraStudents: number        // Additional students purchased
    extraStudentPacks: {
        packId: string
        students: number
        price: number
        purchasedAt: Date
        orderId: string
    }[]

    // ── Add-on: Extra Teachers ──
    extraTeachers: number
    extraTeacherPacks: {
        packId: string
        teachers: number
        price: number
        purchasedAt: Date
        orderId: string
    }[]

    // ── Effective Limits (plan + add-ons) ──
    effectiveMaxStudents: number  // Plan limit + extra purchased
    effectiveMaxTeachers: number

    updatedAt: Date
    createdAt: Date
}

const MonthlyCreditSchema = new Schema({
    month: { type: String, required: true },
    plan: { type: String, required: true },
    creditsGiven: { type: Number, default: 0 },
    creditsFromPrev: { type: Number, default: 0 },
    creditsExpiredAt: { type: Date },
}, { _id: false })

const ExtraStudentPackSchema = new Schema({
    packId: { type: String, required: true },
    students: { type: Number, required: true },
    price: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now },
    orderId: { type: String, required: true },
}, { _id: false })

const ExtraTeacherPackSchema = new Schema({
    packId: { type: String, required: true },
    teachers: { type: Number, required: true },
    price: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now },
    orderId: { type: String, required: true },
}, { _id: false })

const MessageCreditSchema = new Schema<IMessageCredit>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        unique: true,
        index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalUsed: { type: Number, default: 0 },
    totalExpired: { type: Number, default: 0 },
    monthlyCredits: { type: [MonthlyCreditSchema], default: [] },

    // Add-ons
    extraStudents: { type: Number, default: 0 },
    extraStudentPacks: { type: [ExtraStudentPackSchema], default: [] },
    extraTeachers: { type: Number, default: 0 },
    extraTeacherPacks: { type: [ExtraTeacherPackSchema], default: [] },
    effectiveMaxStudents: { type: Number, default: 0 },
    effectiveMaxTeachers: { type: Number, default: 0 },
}, { timestamps: true })

export const MessageCredit =
    mongoose.models.MessageCredit ||
    mongoose.model<IMessageCredit>('MessageCredit', MessageCreditSchema)