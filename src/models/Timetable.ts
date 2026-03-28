import mongoose, { Schema, Document } from 'mongoose'

export interface ITimetable extends Document {
    tenantId: mongoose.Types.ObjectId
    class: string
    section?: string
    days: Array<{
        day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
        periods: Array<{
            periodNo: number
            startTime: string
            endTime: string
            subject: string
            teacherId?: mongoose.Types.ObjectId
        }>
    }>
    createdBy: mongoose.Types.ObjectId
}

const TimetableSchema = new Schema<ITimetable>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    class: { type: String, required: true },
    section: { type: String },
    days: [{
        day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], required: true },
        periods: [{
            periodNo: { type: Number, required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            subject: { type: String, required: true },
            teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
        }]
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

TimetableSchema.index({ tenantId: 1, class: 1, section: 1 }, { unique: true })

export const Timetable = mongoose.models.Timetable ||
    mongoose.model<ITimetable>('Timetable', TimetableSchema)