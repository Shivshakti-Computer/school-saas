import mongoose, { Schema, Document } from 'mongoose'

export interface ICourse extends Document {
    tenantId: mongoose.Types.ObjectId
    title: string
    description: string
    class: string
    subject: string
    teacherId: mongoose.Types.ObjectId
    lessons: Array<{
        title: string
        type: 'video' | 'pdf' | 'text' | 'quiz'
        content: string
        duration?: number
        order: number
    }>
    isPublished: boolean
    enrolledStudents: mongoose.Types.ObjectId[]
}

const CourseSchema = new Schema<ICourse>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lessons: [{
        title: { type: String, required: true },
        type: { type: String, enum: ['video', 'pdf', 'text', 'quiz'], required: true },
        content: { type: String, required: true },
        duration: { type: Number },
        order: { type: Number, required: true },
    }],
    isPublished: { type: Boolean, default: false },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
}, { timestamps: true })

CourseSchema.index({ tenantId: 1, class: 1 })

export const Course = mongoose.models.Course ||
    mongoose.model<ICourse>('Course', CourseSchema)