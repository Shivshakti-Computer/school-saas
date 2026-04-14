import mongoose, { Schema, Document } from 'mongoose'

// ─────────────────────────────────────────────
// BOOK CATALOGUE
// ─────────────────────────────────────────────

export interface ILibraryBook extends Document {
    tenantId: mongoose.Types.ObjectId
    title: string
    author: string
    isbn?: string
    category: string
    publisher?: string
    publishYear?: number
    edition?: string
    language: string
    tags: string[]
    totalCopies: number
    availableCopies: number
    location?: string   // shelf / rack
    coverImage?: string
    description?: string
    isActive: boolean
    createdBy: mongoose.Types.ObjectId
    updatedBy?: mongoose.Types.ObjectId
}

const LibraryBookSchema = new Schema<ILibraryBook>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 300 },
        author: { type: String, required: true, trim: true, maxlength: 200 },
        isbn: { type: String, trim: true, default: '' },
        category: { type: String, required: true, trim: true },
        publisher: { type: String, trim: true, default: '' },
        publishYear: {
            type: Number,
            min: 1000, max: new Date().getFullYear() + 1,
        },
        edition: { type: String, trim: true, default: '' },
        language: { type: String, default: 'English', trim: true },
        tags: { type: [String], default: [] },
        totalCopies: {
            type: Number, required: true, default: 1, min: 1,
        },
        availableCopies: {
            type: Number, required: true, default: 1, min: 0,
        },
        location: { type: String, trim: true, default: '' },
        coverImage: { type: String, default: '' },
        description: { type: String, trim: true, maxlength: 1000, default: '' },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
)

// Text index for full-text search
LibraryBookSchema.index(
    { title: 'text', author: 'text', isbn: 'text', tags: 'text' },
    { weights: { title: 10, author: 5, isbn: 8, tags: 3 } }
)
LibraryBookSchema.index({ tenantId: 1, category: 1, isActive: 1 })
LibraryBookSchema.index({ tenantId: 1, isActive: 1, availableCopies: 1 })

// availableCopies can never exceed totalCopies
LibraryBookSchema.pre('save', function () {
    if (this.availableCopies > this.totalCopies) {
        this.availableCopies = this.totalCopies
    }
    if (this.availableCopies < 0) {
        this.availableCopies = 0
    }
})

export const LibraryBook =
    mongoose.models.LibraryBook ||
    mongoose.model<ILibraryBook>('LibraryBook', LibraryBookSchema)


// ─────────────────────────────────────────────
// ISSUE / RETURN RECORD
// ─────────────────────────────────────────────

export type IssueStatus = 'issued' | 'returned' | 'overdue' | 'lost'

export interface ILibraryIssue extends Document {
    tenantId: mongoose.Types.ObjectId
    bookId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    issuedAt: Date
    dueDate: Date
    returnedAt?: Date
    fine: number          // calculated fine amount
    finePaid: boolean
    finePaidAt?: Date
    finePerDay: number          // stored at issue time — consistent
    status: IssueStatus
    issuedBy: mongoose.Types.ObjectId
    returnedBy?: mongoose.Types.ObjectId
    reminderSent: boolean
    notes?: string
}

const LibraryIssueSchema = new Schema<ILibraryIssue>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'LibraryBook',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        issuedAt: { type: Date, default: Date.now },
        dueDate: { type: Date, required: true },
        returnedAt: { type: Date },
        fine: { type: Number, default: 0, min: 0 },
        finePaid: { type: Boolean, default: false },
        finePaidAt: { type: Date },
        finePerDay: { type: Number, default: 2, min: 0 },  // ₹2/day default
        status: {
            type: String,
            enum: ['issued', 'returned', 'overdue', 'lost'],
            default: 'issued',
        },
        issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        returnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reminderSent: { type: Boolean, default: false },
        notes: { type: String, trim: true, maxlength: 500 },
    },
    { timestamps: true }
)

LibraryIssueSchema.index({ tenantId: 1, studentId: 1, status: 1 })
LibraryIssueSchema.index({ tenantId: 1, dueDate: 1, status: 1 })
LibraryIssueSchema.index({ tenantId: 1, bookId: 1, status: 1 })
LibraryIssueSchema.index({ tenantId: 1, status: 1, createdAt: -1 })

export const LibraryIssue =
    mongoose.models.LibraryIssue ||
    mongoose.model<ILibraryIssue>('LibraryIssue', LibraryIssueSchema)