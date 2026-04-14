import mongoose, { Schema, Document } from 'mongoose'

export interface IPeriod {
    periodNo: number
    startTime: string   // "HH:MM"
    endTime: string   // "HH:MM"
    subject: string
    teacherId?: mongoose.Types.ObjectId
    isBreak?: boolean  // lunch / recess
    breakLabel?: string // "Lunch Break", "Recess"
}

export interface IDaySchedule {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
    periods: IPeriod[]
}

export interface ITimetable extends Document {
    tenantId: mongoose.Types.ObjectId
    academicYear: string          // "2024-25"
    class: string
    section?: string
    days: IDaySchedule[]
    isActive: boolean
    createdBy: mongoose.Types.ObjectId
    updatedBy?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const PeriodSchema = new Schema<IPeriod>(
    {
        periodNo: { type: Number, required: true, min: 1 },
        startTime: {
            type: String, required: true,
            validate: {
                validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                message: 'startTime must be HH:MM format',
            },
        },
        endTime: {
            type: String, required: true,
            validate: {
                validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                message: 'endTime must be HH:MM format',
            },
        },
        subject: { type: String, required: true, trim: true, maxlength: 100 },
        teacherId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        isBreak: { type: Boolean, default: false },
        breakLabel: { type: String, default: '' },
    },
    { _id: false }
)

const DayScheduleSchema = new Schema<IDaySchedule>(
    {
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            required: true,
        },
        periods: { type: [PeriodSchema], default: [] },
    },
    { _id: false }
)

const TimetableSchema = new Schema<ITimetable>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYear: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}$/, 'Format must be YYYY-YY'],
            index: true,
        },
        class: { type: String, required: true, trim: true },
        section: { type: String, default: '', trim: true },
        days: { type: [DayScheduleSchema], default: [] },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
)

// ── Unique per class+section+academicYear per school ──
TimetableSchema.index(
    { tenantId: 1, academicYear: 1, class: 1, section: 1 },
    { unique: true }
)

// ── Pre-save: validate period times & remove duplicate periodNo ──
TimetableSchema.pre('save', function () {
    for (const daySchedule of this.days) {
        const seen = new Set<number>()
        for (const p of daySchedule.periods) {
            if (seen.has(p.periodNo)) {
                throw new Error(
                    `Duplicate periodNo ${p.periodNo} on ${daySchedule.day}`
                )
            }
            seen.add(p.periodNo)

            // endTime must be after startTime
            const [sh, sm] = p.startTime.split(':').map(Number)
            const [eh, em] = p.endTime.split(':').map(Number)
            if (eh * 60 + em <= sh * 60 + sm) {
                throw new Error(
                    `Period ${p.periodNo} on ${daySchedule.day}: endTime must be after startTime`
                )
            }
        }
    }
})

export const Timetable =
    mongoose.models.Timetable ||
    mongoose.model<ITimetable>('Timetable', TimetableSchema)