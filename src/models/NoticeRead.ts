// FILE: src/models/NoticeRead.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface INoticeRead extends Document {
    noticeId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    userName: string
    userRole: string
    readAt: Date
    tenantId: mongoose.Types.ObjectId
}

const NoticeReadSchema = new Schema<INoticeRead>({
    noticeId: {
        type: Schema.Types.ObjectId,
        ref: 'Notice',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
}, { timestamps: true })

// Compound unique index
NoticeReadSchema.index({ noticeId: 1, userId: 1 }, { unique: true })
NoticeReadSchema.index({ tenantId: 1, userId: 1, readAt: -1 })

export const NoticeRead =
    mongoose.models.NoticeRead ||
    mongoose.model<INoticeRead>('NoticeRead', NoticeReadSchema)