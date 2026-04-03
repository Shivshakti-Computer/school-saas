// FILE: src/models/Announcement.ts
// Superadmin creates announcements → public dekhe
// Backward compatible — no existing model touch
// ═══════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type AnnouncementType =
    | 'feature'      // Naya feature
    | 'update'       // Existing feature update
    | 'maintenance'  // Downtime/maintenance
    | 'offer'        // Discount/offer
    | 'general'      // General info

export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface IAnnouncement extends Document {
    title: string
    summary: string           // Short — banner/card mein dikhega
    content: string           // Full detail — detail page mein
    type: AnnouncementType
    status: AnnouncementStatus
    isPinned: boolean         // Top pe dikhega always
    isBanner: boolean         // Sitewide top banner dikhega
    bannerText?: string       // Short banner text (max 100 chars)
    bannerColor?: string      // Banner background color
    publishedAt?: Date
    expiresAt?: Date          // Is date ke baad auto-hide
    tags: string[]
    createdAt: Date
    updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: String, required: true },
    type: {
        type: String,
        enum: ['feature', 'update', 'maintenance', 'offer', 'general'],
        default: 'general',
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
    },
    isPinned: { type: Boolean, default: false },
    isBanner: { type: Boolean, default: false },
    bannerText: { type: String, maxlength: 120 },
    bannerColor: { type: String, default: '#2563EB' },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    tags: [{ type: String, trim: true }],
}, { timestamps: true })

// Index for fast public queries
AnnouncementSchema.index({ status: 1, publishedAt: -1 })
AnnouncementSchema.index({ isBanner: 1, status: 1 })
AnnouncementSchema.index({ isPinned: 1, status: 1 })

export const Announcement =
    mongoose.models.Announcement ||
    mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)