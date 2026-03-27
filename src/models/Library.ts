// src/models/Library.ts

import mongoose, { Schema, Document } from 'mongoose'

/* ─── Book catalogue ─── */
export interface ILibraryBook extends Document {
    tenantId: mongoose.Types.ObjectId
    title: string
    author: string
    isbn?: string
    category: string
    publisher?: string
    publishYear?: number
    totalCopies: number
    availableCopies: number
    location?: string   // shelf / rack number
    coverImage?: string
    isActive: boolean
}

const LibraryBookSchema = new Schema<ILibraryBook>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String },
    category: { type: String, required: true },
    publisher: { type: String },
    publishYear: { type: Number },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    location: { type: String },
    coverImage: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

// Text index for search
LibraryBookSchema.index({ tenantId: 1, title: 'text', author: 'text', isbn: 'text' })

export const LibraryBook =
    mongoose.models.LibraryBook ||
    mongoose.model<ILibraryBook>('LibraryBook', LibraryBookSchema)


/* ─── Issue / Return record ─── */
export interface ILibraryIssue extends Document {
    tenantId: mongoose.Types.ObjectId
    bookId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    issuedAt: Date
    dueDate: Date
    returnedAt?: Date
    fine: number
    finePaid: boolean
    status: 'issued' | 'returned' | 'overdue' | 'lost'
    issuedBy: mongoose.Types.ObjectId   // librarian / admin userId
    reminderSent: boolean
    notes?: string
}

const LibraryIssueSchema = new Schema<ILibraryIssue>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    bookId: { type: Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    fine: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['issued', 'returned', 'overdue', 'lost'],
        default: 'issued',
    },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reminderSent: { type: Boolean, default: false },
    notes: { type: String },
}, { timestamps: true })

LibraryIssueSchema.index({ tenantId: 1, studentId: 1, status: 1 })
LibraryIssueSchema.index({ tenantId: 1, dueDate: 1, status: 1 })

export const LibraryIssue =
    mongoose.models.LibraryIssue ||
    mongoose.model<ILibraryIssue>('LibraryIssue', LibraryIssueSchema)