// FILE: src/models/Feedback.ts
// Public reviews — koi bhi de sake
// Superadmin approve kare tab public dikhе
// ═══════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type FeedbackStatus = 'pending' | 'approved' | 'rejected'
export type FeedbackType = 'review' | 'suggestion' | 'bug' | 'general'

export interface IFeedback extends Document {
    // School info (self-reported — no auth required)
    schoolName: string
    schoolLocation?: string   // City, State
    contactName: string       // Principal/Admin name
    contactEmail?: string
    contactPhone?: string

    // Feedback content
    type: FeedbackType
    rating: number            // 1-5 stars
    title: string             // Short headline
    message: string           // Detailed feedback
    wouldRecommend: boolean

    // Moderation
    status: FeedbackStatus
    isPublic: boolean         // Approved + public dikhe
    superadminNote?: string   // Internal note

    // Meta
    ipAddress?: string
    submittedAt: Date
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const FeedbackSchema = new Schema<IFeedback>({
    schoolName: { type: String, required: true, trim: true, maxlength: 200 },
    schoolLocation: { type: String, trim: true, maxlength: 100 },
    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },

    type: {
        type: String,
        enum: ['review', 'suggestion', 'bug', 'general'],
        default: 'review',
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    wouldRecommend: { type: Boolean, default: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    isPublic: { type: Boolean, default: false },
    superadminNote: { type: String },

    ipAddress: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
}, { timestamps: true })

FeedbackSchema.index({ status: 1, isPublic: 1 })
FeedbackSchema.index({ rating: -1, createdAt: -1 })

export const Feedback =
    mongoose.models.Feedback ||
    mongoose.model<IFeedback>('Feedback', FeedbackSchema)