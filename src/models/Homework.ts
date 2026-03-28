import mongoose, { Schema, Document } from 'mongoose'

export interface IHomework extends Document {
    tenantId: mongoose.Types.ObjectId
    class: string
    section?: string
    subject: string
    title: string
    description: string
    dueDate: Date
    attachments: string[]
    assignedBy: mongoose.Types.ObjectId
    submissions: Array<{
        studentId: mongoose.Types.ObjectId
        submittedAt: Date
        content?: string
        attachments: string[]
        status: 'pending' | 'submitted' | 'graded'
        marks?: number
        remarks?: string
    }>
}

const HomeworkSchema = new Schema<IHomework>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    class: { type: String, required: true },
    section: { type: String },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    attachments: [{ type: String }],
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submissions: [{
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        submittedAt: { type: Date },
        content: { type: String },
        attachments: [{ type: String }],
        status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
        marks: { type: Number },
        remarks: { type: String },
    }]
}, { timestamps: true })

HomeworkSchema.index({ tenantId: 1, dueDate: -1 })
HomeworkSchema.index({ tenantId: 1, class: 1 })

export const Homework = mongoose.models.Homework ||
    mongoose.model<IHomework>('Homework', HomeworkSchema)